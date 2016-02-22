/**---------------------------------------------------------------------------------------------------------------------
 * field-service/source/commands/customers.js
 */

(function () {
  var customerPresentation = new tgi.Presentation();
  var customerMaintenance = new site.ModelMaintenance(site.Customer);
  var invoiceButtons = [];

  customerPresentation.preRenderCallback = function (command, callback) {
    customerMaintenance.preRenderCallback(command, callback);
  };

  /**
   * Handle invoice edits
   */
  function editInvoice() {
    /**
     * If new set CustomerID else get the model (async op)
     */
    var isNew = (tgi.left(this.name, 3) == 'New');
    var invoice = new site.Invoice();
    if (isNew) {
      invoice.set('CustomerID', this.bucket);
      getInvoiceNumber();
    } else {
      invoice.set('id', this.bucket);
      site.hostStore.getModel(invoice, function (model, error) {
        if (error) {
          app.err('getModel error: ' + error);
        } else {
          //invoice=model;
          getInvoiceNumber();
        }
      });
    }

    /**
     * Prompt for InvoiceNumber
     */
    function getInvoiceNumber() {
      app.ask('Enter Invoice Number', invoice.attributes[2], function (reply) {
        if (!reply)
          queryCancel();
        else {
          invoice.attributes[2].value = reply;
          getServiceDate();
        }
      });
    }

    /**
     * Prompt for ServiceDate
     */
    function getServiceDate() {
      app.ask('Enter Service Date', invoice.attributes[3], function (reply) {
        if (!reply)
          queryCancel();
        else {
          invoice.attributes[3].value = reply;
          getServiceDate();
        }
      });
    }

    /**
     * Prompt for TankPumped
     */
    function getTankPumped() {
    }

    /**
     * Prompt for Comments
     */
    function getComments() {
    }

    /**
     * QueryCancel
     */
    function queryCancel() {
    }

    /**
     * QueryDone
     */
    function queryDone() {
    }

  }

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
            if (invoices.get('ServiceDate'))
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

  var customerCommand = new tgi.Command({
    name: 'Customers',
    theme: 'success',
    type: 'Presentation',
    icon: 'fa-user',
    contents: customerPresentation
  });
  //site.modelsMenu.push(customerCommand);
  site.navContents.push(customerCommand);

  /**
   * force
   */
  setTimeout(function () {
    customerCommand.execute(ui);
  }, 100);

}());