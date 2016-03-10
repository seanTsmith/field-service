/**---------------------------------------------------------------------------------------------------------------------
 * field-service/import.js
 */

var site = {};
var fs = require('fs');
var customer;
var records;
var recno = 0;
var lastCustomerID = -1;


console.log('-----------------------');
console.log('field-service/import.js');
console.log('-----------------------');

/**
 * tgi lib
 */
var TGI = require('./server.lib.js');
var tgi = TGI.CORE();

site.Customer = function (args) {
  if (false === (this instanceof site.Customer)) throw new Error('new operator required');
  args = args || {};
  if (!args.attributes) {
    args.attributes = [];
  }
  args.attributes.push(new tgi.Attribute({name: 'Customer', type: 'String(50)'}));
  args.attributes.push(new tgi.Attribute({name: 'Address1', label:'Address', type: 'String(50)'}));
  args.attributes.push(new tgi.Attribute({name: 'Address2', type: 'String(50)', hidden: '*'}));
  args.attributes.push(new tgi.Attribute({name: 'City', type: 'String(35)'}));
  args.attributes.push(new tgi.Attribute({name: 'State', type: 'String(2)', hidden: '*'}));
  args.attributes.push(new tgi.Attribute({name: 'Zip', type: 'String(10)', hidden: '*'}));
  args.attributes.push(new tgi.Attribute({name: 'Contact', type: 'String(50)', hidden: '*'}));
  args.attributes.push(new tgi.Attribute({name: 'HomePhone', type: 'String(25)', hidden: '*'}));
  args.attributes.push(new tgi.Attribute({name: 'WorkPhone', type: 'String(25)', hidden: '*'}));
  args.attributes.push(new tgi.Attribute({name: 'CellPhone', type: 'String(25)', hidden: '*'}));
  args.attributes.push(new tgi.Attribute({name: 'Comments', type: 'String(255)', hidden: '*'}));
  tgi.Model.call(this, args);
  this.modelType = "Customer";
};
site.Customer.prototype = Object.create(tgi.Model.prototype);

site.Invoice = function (args) {
  if (false === (this instanceof site.Invoice)) throw new Error('new operator required');
  args = args || {};
  if (!args.attributes) {
    args.attributes = [];
  }
  args.attributes.push(new tgi.Attribute({name: 'CustomerID', type: 'ID'}));
  args.attributes.push(new tgi.Attribute({name: 'InvoiceNumber', type: 'String(8)'}));
  args.attributes.push(new tgi.Attribute({name: 'ServiceDate', type: 'Date'}));
  args.attributes.push(new tgi.Attribute({name: 'TankPumped', type: 'Boolean'}));
  args.attributes.push(new tgi.Attribute({name: 'Comments', type: 'String'}));
  tgi.Model.call(this, args);
  this.modelType = "Invoice";
};
site.Invoice.prototype = Object.create(tgi.Model.prototype);

/**
 * Mongo
 */
var mongo = require('mongodb');
var MongoStore = TGI.STORE.MONGODB().MongoStore;
var mongoStore = new MongoStore({name: 'www.tgi.io'});
var options = {};

options.databaseName = 'fieldServiceDB';
options.userName = process.env.OPENSHIFT_MONGODB_DB_USERNAME;
options.password = process.env.OPENSHIFT_MONGODB_DB_PASSWORD;
options.authdb = 'admin';
options.vendor = mongo;
options.keepConnection = true;
options.host = process.env.OPENSHIFT_MONGODB_DB_HOST;
if (process.env.OPENSHIFT_MONGODB_DB_PORT)
  options.port = parseInt(process.env.OPENSHIFT_MONGODB_DB_PORT);

mongoStore.onConnect('http://localhost', function (store, err) {
  if (err) {
    console.log('mongoStore unavailable (' + err + ')');
    process.exit(1);
  }
  importCustomersCommand.execute();
}, options);

function fixPhone(phone) {
  phone = phone || '';
  if (phone.length == 10)
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  return phone;
}

var importCustomersCommand = new tgi.Command({
  name: 'import customers', type: 'Procedure', contents: new tgi.Procedure({
    tasks: [

      /**
       * Create customer
       */
        function () {
        var task = this;
        records = JSON.parse(fs.readFileSync('import/ServiceExport.json', 'utf8'));
        function doCustomer() {
          try {
            if (recno < records.length) {
              var record = records[recno];
              recno++;
              if (!(recno % 100))
                console.log('on rec #' + recno);
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
                customer.set('HomePhone', fixPhone(record.HomePhone));
                customer.set('WorkPhone', fixPhone(record.WorkPhone));
                customer.set('CellPhone', fixPhone(record.CellPhone));
                // customer.set('Comments', record.Comments || '');
                customer.set('Comments', '');
                mongoStore.putModel(customer, function (model, error) {
                  if (typeof error != 'undefined') {
                    console.error('error putting customer ' + customer.get('name') + ': ' + error);
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
            console.error('error creating customer ' + e);
          }
          function doInvoice(record) {
            var invoice = new site.Invoice();
            invoice.set('CustomerID', customer.get('id'));
            invoice.set('InvoiceNumber', record.InvoiceNumber || '');
            if (record.ServiceDate)
              invoice.set('ServiceDate', new Date(record.ServiceDate));
            invoice.set('TankPumped', record.TankPumped == "TRUE");
            //invoice.set('Comments', record.Service_Comments || '');
            invoice.set('Comments', record.Comments || '');
            mongoStore.putModel(invoice, function (model, error) {
              if (typeof error != 'undefined') {
                console.error('error putting invoice ' + invoice.get('InvoiceNumber') + ': ' + error);
                task.abort();
              } else {
                setTimeout(function () {
                  doCustomer();
                }, 0);
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
    console.log('Imported successfully.');
  else
    console.error('Procedure failed.');
  process.exit(1);
});
importCustomersCommand.onEvent('*', function (event,wtf) {
  switch (event) {
    case 'Error':
      console.log('ERROR ' + wtf);
      process.exit(1);
      break;
    default:
  }
});
