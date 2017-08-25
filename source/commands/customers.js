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
  var hasOpenInvoice = false;
  var hasAnyActivity = false;
  var customerWas;

  /**
   * Model for our list view
   */
  var OrderList = function (args) {
    if (false === (this instanceof OrderList)) throw new Error('new operator required');
    args = args || {};
    if (!args.attributes) {
      args.attributes = [];
    }
    args.attributes.push(new tgi.Attribute({name: 'Date', type: 'String'}));
    args.attributes.push(new tgi.Attribute({name: 'InvoiceNumber',label: 'Invoice #', type: 'String'}));
    args.attributes.push(new tgi.Attribute({name: 'Notes', label: 'Notes', type: 'String'}));
    tgi.Model.call(this, args);
    this.modelType = "LocateOrder";
  };
  OrderList.prototype = Object.create(tgi.Model.prototype);

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
      site.customerInvoiceIsNew = (tgi.left(this.name, 3) === 'New');
      site.customerInvoice = new site.Invoice();
      if (site.customerInvoiceIsNew) {
        site.customerInvoice.set('CustomerID', this.bucket);
        triggerRenderInvoice();
      } else {
        site.customerInvoice.set('id', this.bucket);
        site.hostStore.getModel(site.customerInvoice, function (model, error) {
          site.customerInvoice = model;
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

      /**
       * Massage data before saving
       */

      if (site.customerInvoice.get('InvoiceNumber') === null)
        site.customerInvoice.set('InvoiceNumber', '');

      if (site.customerInvoice.get('InvoiceNumber').length)
        site.customerInvoice.set('UtilityLocate', true);


      site.hostStore.putModel(site.customerInvoice, function (model, error) {
        if (error) {
          self.contents.push('Error putting  ' + site.customerInvoice + ':');
          self.contents.push('' + error);
        } else {
          site.customerMaintenance.viewState = 'VIEW';
          site.customerCommand.execute(designToDo_ui);
          if (site.customerInvoice.get('InvoiceNumber') && site.customerInvoice.get('InvoiceNumber').length)
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
    var primaryTechID = site.customerInvoice.get('PrimaryTechID');
    var secondaryTechID = site.customerInvoice.get('secondaryTechID');
    for (var i = 0; i < site.techID.length; i++) {
      var techID = site.techID[i];
      if (techID === primaryTechID) {
        primaryTech.value = site.techList[i];
      }
      if (techID === secondaryTechID)
        secondaryTech.value = site.techList[i];
    }

    site.customerCommand.presentationMode = 'Edit';
    site.customerMaintenance.contents.push((site.customerInvoiceIsNew ? '#### New Invoice' : '#### Modify Order / Invoice'));
    site.customerMaintenance.contents.push('-');
    for (i = 2; i < site.customerInvoice.attributes.length; i++) {
      switch (site.customerInvoice.attributes[i].name) {
        case 'Address1':
        case 'Address2':
        case 'City':
        case 'State':
        case 'Zip':
        case 'County':
        case 'CrossStreet':
        case 'Contact':
        case 'ContactPhone':
          if (customerWas.get('CompanyGroup'))
            site.customerMaintenance.contents.push(site.customerInvoice.attributes[i]);
          break;

        case 'PrimaryTechID':
          site.customerMaintenance.contents.push(primaryTech);
          break;
        case 'SecondaryTechID':
          site.customerMaintenance.contents.push(secondaryTech);
          break;
        default:
          site.customerMaintenance.contents.push(site.customerInvoice.attributes[i]);
      }
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
            if (primaryTech.value === '(unassigned)') {
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
            if (secondaryTech.value === '(unassigned)') {
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
            site.customerInvoice.set('PrimaryTechID', primaryTechID);
            site.customerInvoice.set('secondaryTechID', secondaryTechID);
            saveInvoice();
            task.complete();
          }
        ]
      })
    }));
    if (!site.customerInvoiceIsNew)
      site.customerMaintenance.contents.push(new tgi.Command({
        name: 'Delete',
        theme: 'danger',
        icon: 'fa-minus-circle',
        type: 'Function',
        contents: function () {
          // site.safeDelete = function (name, callback) {}
          site.safeDelete('invoice', function () {
            site.hostStore.deleteModel(site.customerInvoice, function (mod, err) {
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
    customerWas=customer;
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
    site.hostStore.getList(new tgi.List(new site.Invoice()), {CustomerID: customer.get('id')}, {}, function (invoices, error) {
      if (error) {
        app.err('site.customerMaintenance.onRenderAttributes getList error: ' + error);
      } else {
        var daOrder = new OrderList();
        var listView = new tgi.List(daOrder);
        var attributes = [];
        var gotMore = invoices.moveFirst();
        while (gotMore) {
          hasAnyActivity = true;
          var InvoiceNumber = invoices.get('InvoiceNumber');
          if (!invoices.get('InvoiceNumber')) {
            InvoiceNumber = '<i>(open order)</i>';
            hasOpenInvoice = true;
          } else if (invoices.get('InvoiceNumber')==='*')
            InvoiceNumber = '<i>(CANCELED)</i>';

          var rawDate = invoices.get('ServiceDate');
          var theDate = rawDate ? tgi.left(rawDate.toISOString(), 10) : '(not set)'; // ;

          var notes = invoices.get('CustomerIssues');
          if (invoices.get('Comments'))
            notes += ' <i><strong>Tech:</strong> ' + invoices.get('Comments') + '</i>';

          listView.addItem(new OrderList());
          listView.set('id', invoices.get('id'));
          listView.set('Date', theDate);
          listView.set('InvoiceNumber', InvoiceNumber);
          listView.set('Notes', notes);
          gotMore = invoices.moveNext();
        }
        if (listView.moveFirst())
          attributes.push(listView);

        listView.pickKludge = function (id) {
          site.customerInvoiceIsNew = false;
          site.customerInvoice = new site.Invoice();
          site.customerInvoice.set('id', id);
          site.hostStore.getModel(site.customerInvoice, function (model, error) {
            site.customerInvoice = model;
            if (error) {
              app.err('getModel error: ' + error);
            } else {
              site.customerMaintenance.viewState = 'CUSTOM';
              site.customerCommand.execute(designToDo_ui);
            }
          });
        };
        callback(attributes);
      }
    });
  });
  site.customerMaintenance.onRenderCommands(function (customer, callback) {
    if (!hasOpenInvoice || customer.get('CompanyGroup')) {
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
  // setTimeout(function () {
  //   site.customerMaintenance.modelID = '599adfb8fe2a04ab361b2f04';
  //   site.customerMaintenance.internalRefresh = true;
  //   site.customerMaintenance.viewState = 'VIEW';
  //   site.customerCommand.execute(designToDo_ui);
  // }, 100);
}());