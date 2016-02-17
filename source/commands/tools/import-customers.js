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
          $.getJSON('ServiceExport.json', function (data) {
            records = data;
            console.log('got bytes ' + data.length);
            task.complete();
          }).fail(function (a, b, c) {
            app.err('getJSON error ' + c);
            task.abort();
          });
        },


        /*
         *
         Customer.CustomerID,
         Customer.Company,
         Customer.Customer,
         Customer.Address1,
         Customer.Address2,
         Customer.City,
         Customer.State,
         Customer.Zip,
         Customer.HomePhone,
         Customer.WorkPhone,
         Customer.CellPhone,
         Customer.Comments,
         Service.ServiceDate,
         Service.InvoiceNumber,
         Service.AmountCharged,
         Service.TankPumped,
         Service.Comments

         FROM Customer RIGHT JOIN Service ON Customer.CustomerID = Service.CustomerID

         ORDER BY Customer.CustomerID;

         *
         * */

        /**
         * Create customer
         */
          function () {
          console.log('Create customer');
          var task = this;
          try {
            function doit() {
              if (recno < 100) { // records.length) {
                var record = records[recno];
                recno++;

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
                      doit();
                    }
                  });
                } else {
                  doit();
                }
              } else {
                task.complete();
              }
            }

            console.log('1st do it');
            doit();
          } catch (e) {
            app.err('error creating customer' + e);
          }
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
