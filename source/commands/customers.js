/**---------------------------------------------------------------------------------------------------------------------
 * field-service/source/commands/customers.js
 */
var designToDo_ui = ui;
(function () {
  var customerPresentation = new tgi.Presentation();
  var customerMaintenance = new site.ModelMaintenance(site.Customer);
  var invoiceButtons = [];
  var customerCommand;
  var invoice;
  var isNewInvoice;

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
      site.hostStore.putModel(invoice, function (model, error) {
        if (error) {
          self.contents.push('Error putting  ' + invoice + ':');
          self.contents.push('' + error);
        } else {
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
    invoice.set('ServiceDate', new Date(invoice.get('ServiceDate'))); // todo fix
    customerCommand.presentationMode = 'Edit';
    customerMaintenance.contents.push((isNewInvoice ? '#### New Invoice' : '#### Modify Invoice'));
    customerMaintenance.contents.push('-');
    for (var i = 2; i < invoice.attributes.length; i++) {
      customerMaintenance.contents.push(invoice.attributes[i]);
    }
    customerMaintenance.contents.push('-');


    customerMaintenance.contents.push(new tgi.Command({
      name: 'Save Invoice',
      theme: 'success',
      icon: 'fa-check-circle',
      type: 'Function',
      contents: saveInvoice
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
    invoiceButtons = [];
    site.hostStore.getList(new tgi.List(new site.Invoice()), {CustomerID: customer.get('id')}, {},
      function (invoices, error) {
        if (error) {
          app.err('customerMaintenance.onRenderAttributes getList error: ' + error);
        } else {
          var attributes = [];
          var gotMore = invoices.moveFirst();
          while (gotMore) {
            var attribute = new tgi.Attribute("Invoice #" + invoices.get('InvoiceNumber'));
            attribute.value = ''; //
            if (invoices.get('ServiceDate'))
              attribute.value += tgi.left('' + invoices.get('ServiceDate'), 16) + ':';
            if (invoices.get('TankPumped'))
              attribute.value += ' Tank Pumped';
            if (invoices.get('Comments'))
              attribute.value += ' ' + invoices.get('Comments');
            attributes.push(attribute);
            invoiceButtons.push(new tgi.Command({
              name: 'Invoice #' + invoices.get('InvoiceNumber'),
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
    invoiceButtons.push(new tgi.Command({
      name: 'New Invoice ',
      bucket: customer.get('id'),
      icon: 'fa-plus-circle',
      type: 'Function',
      contents: editInvoice
    }));
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
  setTimeout(function () {
    customerCommand.execute(ui);
  }, 100);

}());