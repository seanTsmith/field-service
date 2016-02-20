/**---------------------------------------------------------------------------------------------------------------------
 * field-service/source/commands/tools/import-customers.js
 */

(function () {

  var customer;
  var records;
  var recno = 0;
  var lastCustomerID = -1;
  var importCustomersCommand = new tgi.Command({
    name: 'import customers', type: 'Procedure', contents: new tgi.Procedure({
      tasks: [
        /**
         * Load JSON
         */
          function () {
          var task = this;
          $.getJSON('ServiceExportTiny.json', function (data) {
            records = data;
            task.complete();
          }).fail(function (a, b, c) {
            app.err('getJSON error ' + c);
            task.abort();
          });
        },
        /**
         * Create customer
         */
          function () {
          var task = this;
          function doCustomer() {
            try {
              if (recno < records.length) {
                var record = records[recno];
                recno++;
                console.log('on rec#' + recno);
                // var lastCustomerID = -1;
                var thisCustomerID = record.CustomerID;
                if (thisCustomerID != lastCustomerID) {
                  lastCustomerID = thisCustomerID;
                  customer = new site.Customer();
                  if (record.Company && tgi.trim(record.Company).length) {
                    customer.set('Customer', record.Company || '');
                    customer.set('Contact', record.Customer || '');
                  } else {
                    customer.set('Customer', record.Customer || '');
                    customer.set('Contact', '');
                  }
                  customer.set('Address1', record.Address1 || '');
                  customer.set('Address2', record.Address2 || '');
                  customer.set('City', record.City || '');
                  customer.set('State', record.State || '');
                  customer.set('Zip', record.Zip || '');
                  customer.set('HomePhone', record.HomePhone || '');
                  customer.set('WorkPhone', record.WorkPhone || '');
                  customer.set('CellPhone', record.CellPhone || '');
                  customer.set('Comments', record.Comments || '');
                  site.hostStore.putModel(customer, function (model, error) {
                    if (typeof error != 'undefined') {
                      app.err('error putting customer ' + customer.get('name') + ': ' + error);
                      task.abort();
                    } else {
                      doInvoice(record);
                    }
                  });
                } else {
                  doInvoice(record);
                }
              } else {
                task.complete();
              }
            } catch (e) {
              app.err('error creating customer' + e);
            }
            function doInvoice(record) {
              var invoice = new site.Invoice();
              invoice.set('CustomerID', customer.get('id'));
              invoice.set('InvoiceNumber', record.InvoiceNumber || '');
              if (record.ServiceDate)
                invoice.set('ServiceDate', new Date(record.ServiceDate));
              invoice.set('TankPumped', record.TankPumped == "TRUE");
              invoice.set('Comments', record.Service_Comments || '');
              site.hostStore.putModel(invoice, function (model, error) {
                if (typeof error != 'undefined') {
                  app.err('error putting invoice ' + invoice.get('InvoiceNumber') + ': ' + error);
                  task.abort();
                } else {
                  doCustomer();
                }
              });
            }
          }
          doCustomer();
        }
      ]
    })
  });
  importCustomersCommand.onEvent('Completed', function (event) {
    if (this.status == 1)
      app.done('Imported successfully.');
    else
      app.warn('Procedure failed.');
  });
  site.toolsMenu.push(importCustomersCommand);
  //setTimeout(function () {
  //  importCustomersCommand.execute(ui);
  //}, 0);

}());
