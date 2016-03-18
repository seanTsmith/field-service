/**---------------------------------------------------------------------------------------------------------------------
 * field-service/source/commands/customers.js
 */
var designToDo_ui = ui;
(function () {
  if (!site.loggedIn) {
    return;
  }
  var customerPresentation = new tgi.Presentation();
  site.customerMaintenance = new site.ModelMaintenance(site.Customer, {Customer: 1});
  var invoiceButtons = [];
  var invoice;
  var isNewInvoice;
  var hasOpenInvoice = false;
  var hasAnyActivity = false;

  customerPresentation.preRenderCallback = function (command, callback) {
    site.customerMaintenance.preRenderCallback(command, callback);
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
        site.customerMaintenance.viewState = 'CUSTOM';
        site.customerCommand.execute(designToDo_ui);
      }
    } catch (e) {
      console.log('error ' + e);
    }
  }

  function saveInvoice() {
    try {
      //console.log('saveInvoice() ...');
      //console.log(JSON.stringify(invoice));

      /**
       * Massage data before saving
       */

      if (invoice.get('InvoiceNumber') === null)
        invoice.set('InvoiceNumber', '');

      if (invoice.get('InvoiceNumber').length)
        invoice.set('UtilityLocate', true);


      site.hostStore.putModel(invoice, function (model, error) {
        if (error) {
          self.contents.push('Error putting  ' + invoice + ':');
          self.contents.push('' + error);
        } else {
          site.customerMaintenance.viewState = 'VIEW';
          site.customerCommand.execute(designToDo_ui);
          if (invoice.get('InvoiceNumber') && invoice.get('InvoiceNumber').length)
            app.info('Invoice saved');
          else
            app.info('Work Order saved');
        }

      });
    } catch (e) {
      console.log('error caught ' + e);
    }
  }

  /**
   * When deleting check invoices for use
   */
  site.customerMaintenance.onDelete(function (model, callback) {
    if (hasAnyActivity)
      callback(new Error('Invoices or orders must be deleted first.'));
    else
      callback();
  });

  /**
   * Render custom view (invoice edit)
   */
  site.customerMaintenance.onCustomViewState(function (callback) {

    var primaryTech = new tgi.Attribute({name: 'Primary Tech', type: 'String(25)', quickPick: site.techList, validationRule: {isOneOf: site.techList}});
    var secondaryTech = new tgi.Attribute({name: 'Secondary Tech', type: 'String(25)', quickPick: site.techList, validationRule: {isOneOf: site.techList}});
    primaryTech.value = '(unassigned)';
    secondaryTech.value = '(unassigned)';
    var primaryTechID = invoice.get('PrimaryTechID');
    var secondaryTechID = invoice.get('secondaryTechID');
    for (var i = 0; i < site.techID.length; i++) {
      var techID = site.techID[i];
      if (techID == primaryTechID) {
        primaryTech.value = site.techList[i];
      }
      if (techID == secondaryTechID)
        secondaryTech.value = site.techList[i];
    }

    //invoice.set('ServiceDate', new Date(invoice.get('ServiceDate'))); // todo fix
    site.customerCommand.presentationMode = 'Edit';
    site.customerMaintenance.contents.push((isNewInvoice ? '#### New Invoice' : '#### Modify Order / Invoice'));
    site.customerMaintenance.contents.push('-');
    for (i = 2; i < invoice.attributes.length; i++) {
      if (invoice.attributes[i].name == 'PrimaryTechID')
        site.customerMaintenance.contents.push(primaryTech);
      else if (invoice.attributes[i].name == 'SecondaryTechID')
        site.customerMaintenance.contents.push(secondaryTech);
      else
        site.customerMaintenance.contents.push(invoice.attributes[i]);
    }
    site.customerMaintenance.contents.push('-');
    site.customerMaintenance.contents.push(new tgi.Command({
      name: 'Save Order / Invoice',
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
    if (!isNewInvoice)
      site.customerMaintenance.contents.push(new tgi.Command({
        name: 'Delete',
        theme: 'danger',
        icon: 'fa-minus-circle',
        type: 'Function',
        contents: function () {
          // site.safeDelete = function (name, callback) {}
          site.safeDelete('invoice', function () {
            site.hostStore.deleteModel(invoice, function (mod, err) {
              if (err) {
                app.err(err);
              } else {
                app.info('invoice deleted')
              }
            });
            site.customerMaintenance.viewState = 'VIEW';
            site.customerCommand.execute(designToDo_ui);
          });
        }
      }));
    site.customerMaintenance.contents.push(new tgi.Command({
      name: 'Cancel',
      theme: 'default',
      icon: 'fa-ban',
      type: 'Function',
      contents: function () {
        site.customerMaintenance.viewState = 'VIEW';
        site.customerCommand.execute(designToDo_ui);
      }
    }));

    // equiv of callbackDone()
    site.customerMaintenance.internalRefresh = true;
    site.customerMaintenance.presentation.set('contents', site.customerMaintenance.contents);
    site.customerMaintenance.callback();
  });

  /**
   * After model attributes rendered add each invoice
   */
  site.customerMaintenance.onRenderAttributes(function (customer, callback) {
    hasOpenInvoice = false;
    hasAnyActivity = false;
    invoiceButtons = [];
    invoiceButtons.push(new tgi.Command({
      name: 'Map',
      bucket: customer.get('id'),
      icon: 'fa-map',
      type: 'Function',
      contents: function () {
        site.Customer.Map(customer.get('id'));
      }
    }));
    site.hostStore.getList(new tgi.List(new site.Invoice()), {CustomerID: customer.get('id')}, {},
      function (invoices, error) {
        if (error) {
          app.err('site.customerMaintenance.onRenderAttributes getList error: ' + error);
        } else {
          var attributes = [];
          var gotMore = invoices.moveFirst();
          while (gotMore) {
            hasAnyActivity = true;
            var invoiceLabel = 'Invoice #' + invoices.get('InvoiceNumber');
            if (!invoices.get('InvoiceNumber')) {
              invoiceLabel = 'OPEN ORDER';
              hasOpenInvoice = true;
            }
            var attribute = new tgi.Attribute(invoiceLabel);
            attribute.value = ''; //
            if (invoices.get('ServiceDate'))
              attribute.value += tgi.left('' + invoices.get('ServiceDate'), 16) + ':';
            if (invoices.get('CustomerIssues'))
              attribute.value += ' ' + invoices.get('CustomerIssues');
            if (invoices.get('TankPumped'))
              attribute.value += ' Tank Pumped';
            if (invoices.get('Comments'))
              attribute.value += ' ' + invoices.get('Comments');
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
  site.customerMaintenance.onRenderCommands(function (customer, callback) {
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
  site.customerCommand = new tgi.Command({
    name: 'Customers',
    theme: 'success',
    type: 'Presentation',
    icon: 'fa-user',
    contents: customerPresentation
  });
  site.navContents.push(site.customerCommand);

  /**
   * force
   */
  //setTimeout(function () {
  //  site.customerCommand.execute(ui);
  //}, 100);

}());