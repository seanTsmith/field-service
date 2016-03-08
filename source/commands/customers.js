/**---------------------------------------------------------------------------------------------------------------------
 * field-service/source/commands/customers.js
 */
var designToDo_ui = ui;
(function () {
  if (!site.loggedIn) {
    return;
  }
  var customerPresentation = new tgi.Presentation();
  var customerMaintenance = new site.ModelMaintenance(site.Customer);
  var invoiceButtons = [];
  var customerCommand;
  var invoice;
  var isNewInvoice;
  var hasOpenInvoice = false;

  customerPresentation.preRenderCallback = function (command, callback) {
    customerMaintenance.preRenderCallback(command, callback);
  };

  /**
   * Handle invoice edits
   */
  function editInvoice() {
    try {
      /**
       * If new set CustomerID else get the model (async op)
       */
      isNewInvoice = (tgi.left(this.name, 3) == 'New');
      invoice = new site.Invoice();
      if (isNewInvoice) {
        invoice.set('CustomerID', this.bucket);
        triggerRenderInvoice();
      } else {
        invoice.set('id', this.bucket);
        site.hostStore.getModel(invoice, function (model, error) {
          invoice = model;
          if (error) {
            app.err('getModel error: ' + error);
          } else {
            triggerRenderInvoice();
          }
        });
      }
      function triggerRenderInvoice() {
        customerMaintenance.viewState = 'CUSTOM';
        customerCommand.execute(designToDo_ui);
      }
    } catch (e) {
      console.log('error ' + e);
    }
  }

  function saveInvoice() {
    try {
      console.log('saveInvoice() ...');
      console.log(JSON.stringify(invoice));
      site.hostStore.putModel(invoice, function (model, error) {
        if (error) {
          self.contents.push('Error putting  ' + invoice + ':');
          self.contents.push('' + error);
        } else {
          app.info('Invoice saved');
          customerMaintenance.viewState = 'VIEW';
          customerCommand.execute(designToDo_ui);
        }

      });
    } catch (e) {
      console.log('error caught ' + e);
    }
  }

  /**
   * Render custom view (invoice edit)
   */
  customerMaintenance.onCustomViewState(function (callback) {

    var primaryTech = new tgi.Attribute({name: 'Primary Tech', type: 'String(25)', quickPick: site.techList, validationRule: {isOneOf: site.techList}});
    var secondaryTech = new tgi.Attribute({name: 'Secondary Tech', type: 'String(25)', quickPick: site.techList, validationRule: {isOneOf: site.techList}});

    primaryTech.value = '(unassigned)';
    secondaryTech.value = '(unassigned)';

    var primaryTechID = invoice.get('PrimaryTechID');
    var secondaryTechID = invoice.get('secondaryTechID');
    for (var i = 0; i < site.techID.length; i++) {
      var techID = site.techID[i];
      if (techID==primaryTechID) {
        primaryTech.value = site.techList[i];
      }

      if (techID==secondaryTechID)
        secondaryTech.value = site.techList[i];
    }


    //invoice.set('ServiceDate', new Date(invoice.get('ServiceDate'))); // todo fix
    customerCommand.presentationMode = 'Edit';
    customerMaintenance.contents.push((isNewInvoice ? '#### New Invoice' : '#### Modify Invoice'));
    customerMaintenance.contents.push('-');
    for (i = 2; i < invoice.attributes.length; i++) {
      if (invoice.attributes[i].name == 'PrimaryTechID')
        customerMaintenance.contents.push(primaryTech);
      else if (invoice.attributes[i].name == 'SecondaryTechID')
        customerMaintenance.contents.push(secondaryTech);
      else
        customerMaintenance.contents.push(invoice.attributes[i]);
    }
    customerMaintenance.contents.push('-');
    customerMaintenance.contents.push(new tgi.Command({
      name: 'Save Invoice',
      theme: 'success',
      icon: 'fa-check-circle',
      type: 'Procedure',
      contents: new tgi.Procedure({
        tasks: [
          function () {
            var task = this;
            customerPresentation.validate(function () {
              if (customerPresentation.validationMessage) {
                app.warn('Please correct: ' + customerPresentation.validationMessage);
              } else {
                task.complete();
              }
            })
          },
          function () {
            var task = this;
            if (primaryTech.value == '(unassigned)') {
              task.complete();
            } else {
              site.hostStore.getList(new tgi.List(new site.Tech()), {Name: primaryTech.value}, function (list, error) {
                if (error) {
                  console.log('error loading tech names: ' + error);
                } else {
                  if (list.moveFirst()) {
                    primaryTechID = list.get('id');
                    task.complete();
                  } else {
                    app.err('tech not found');
                    task.abort();
                  }
                }
              });
            }
          },
          function () {
            var task = this;
            if (secondaryTech.value == '(unassigned)') {
              task.complete();
            } else {
              site.hostStore.getList(new tgi.List(new site.Tech()), {Name: secondaryTech.value}, function (list, error) {
                if (error) {
                  console.log('error loading tech names: ' + error);
                } else {
                  if (list.moveFirst()) {
                    secondaryTechID = list.get('id');
                    task.complete();
                  } else {
                    app.err('tech not found');
                    task.abort();
                  }
                }
              });
            }
          },
          function () {
            invoice.set('PrimaryTechID', primaryTechID);
            invoice.set('secondaryTechID', secondaryTechID);
            saveInvoice();
            task.complete();
          }
        ]
      })
    }));
    customerMaintenance.contents.push(new tgi.Command({
      name: 'Cancel',
      theme: 'default',
      icon: 'fa-ban',
      type: 'Function',
      contents: function () {
        customerMaintenance.viewState = 'VIEW';
        customerCommand.execute(designToDo_ui);
      }
    }));

    // equiv of callbackDone()
    customerMaintenance.internalRefresh = true;
    customerMaintenance.presentation.set('contents', customerMaintenance.contents);
    customerMaintenance.callback();
  });

  /**
   * After model attributes rendered add each invoice
   */
  customerMaintenance.onRenderAttributes(function (customer, callback) {
    hasOpenInvoice = false;
    invoiceButtons = [];
    site.hostStore.getList(new tgi.List(new site.Invoice()), {CustomerID: customer.get('id')}, {},
      function (invoices, error) {
        if (error) {
          app.err('customerMaintenance.onRenderAttributes getList error: ' + error);
        } else {
          var attributes = [];
          var gotMore = invoices.moveFirst();
          while (gotMore) {
            var invoiceLabel = 'Invoice #' + invoices.get('InvoiceNumber');
            if (!invoices.get('InvoiceNumber')) {
              invoiceLabel = 'OPEN ORDER';
              hasOpenInvoice = true;
            }
            var attribute = new tgi.Attribute(invoiceLabel);
            attribute.value = ''; //
            if (invoices.get('ServiceDate'))
              attribute.value += tgi.left('' + invoices.get('ServiceDate'), 16) + ':';
            if (invoices.get('TankPumped'))
              attribute.value += ' Tank Pumped';
            if (invoices.get('Comments'))
              attribute.value += ' ' + invoices.get('Comments');
            else if (invoices.get('CustomerIssues'))
              attribute.value += ' ' + invoices.get('CustomerIssues');
            attributes.push(attribute);

            invoiceButtons.push(new tgi.Command({
              name: invoiceLabel,
              bucket: invoices.get('id'),
              icon: 'fa-pencil-square',
              type: 'Function',
              contents: editInvoice
            }));
            gotMore = invoices.moveNext();
          }
          callback(attributes);
        }
      });
  });
  customerMaintenance.onRenderCommands(function (customer, callback) {
    if (!hasOpenInvoice) {
      invoiceButtons.push(new tgi.Command({
        name: 'New Order',
        bucket: customer.get('id'),
        icon: 'fa-plus-circle',
        type: 'Function',
        contents: editInvoice
      }));
    }
    callback(invoiceButtons);
  });
  customerCommand = new tgi.Command({
    name: 'Customers',
    theme: 'success',
    type: 'Presentation',
    icon: 'fa-user',
    contents: customerPresentation
  });
  site.navContents.push(customerCommand);

  /**
   * force
   */
  //setTimeout(function () {
  //  customerCommand.execute(ui);
  //}, 100);

}());