/**---------------------------------------------------------------------------------------------------------------------
 * field-service/source/commands/tools/import-customers.js
 */

(function () {

  var customer;
  var records;
  var recno=0;
  var importCustomersCommand = new tgi.Command({
    name: 'import customers', type: 'Procedure', contents: new tgi.Procedure({
      tasks: [

        /**
         * Load JSON
         */
          function () {
          var task = this;
          $.getJSON('Customers.json', function (data) {
            records=data;
            console.log('got bytes ' + data.length);
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
          try {

            function doit() {
              if (recno<records.length) {
                var record = records[recno];
                console.log('record #' + recno);
                recno++;

                customer = new site.Customer();
                customer.set('name', record.NAME || '');
                customer.set('firstName', record.FNAME || '');
                customer.set('address1', record.ADR1 || '');
                customer.set('city', record.CITY || '');
                customer.set('state', record.STATE || '');
                customer.set('zip', record.ZIP || '');
                customer.set('invoice', record.SC || '');

                site.hostStore.putModel(customer, function (model, error) {
                  if (typeof error != 'undefined') {
                    app.err('error putting customer ' + customer.get('name') + ': ' + error);
                    task.abort();
                  } else {
                    doit();
                  }
                });
              } else {
                task.complete();
              }
            }

            doit();

            //customer = new site.Customer();
            //customer.set('name', 'admin');
            //customer.set('firstName', 'System');
            //site.hostStore.putModel(customer, function (model, error) {
            //  if (typeof error != 'undefined') {
            //    app.err('error creating admin' + error);
            //    task.abort();
            //  } else {
            //    task.complete();
            //  }
            //});


          } catch (e) {
            app.err('error creating customer' + e);
          }
        }
      ]
    })
  });
  importCustomersCommand.onEvent('Completed', function (event) {
    console.log('wtf');
    if (this.status == 1)
      app.done('Imported successfully.');
    else
      app.warn('Procedure failed.');
  });
  site.toolsMenu.push(importCustomersCommand);
  setTimeout(function () {
    importCustomersCommand.execute(ui);
  }, 0);

}());
