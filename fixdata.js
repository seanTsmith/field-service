/**---------------------------------------------------------------------------------------------------------------------
 * field-service/fixdata.js
 */

var site = {};

console.log('------------------------');
console.log('field-service/fixdata.js');
console.log('------------------------');

/**
 * tgi lib
 */
var TGI = require('./server.lib.js');
var tgi = TGI.CORE();

/**---------------------------------------------------------------------------------------------------------------------
 * field-service/source/models/customer.js
 */
(function () {
  site.customerSource = [
    '(Unknown)',
    'Repeat Customer',
    'Referral: ',
    'YP.com',
    'Yellow Pages',
    "Angie's List",
    "Kudzu",
    "Yelp.com",
    "Google",
    'Mailer: ',
    'Magazines'
  ];

  site.countySource = [
    'Fulton',
    'DeKalb',
    'Gwinnett',
    'Cobb',
    'Clayton',
    'Coweta',
    'Douglas',
    'Fayette',
    'Henry',
    'Walton'
  ];

  // .

  site.Customer = function (args) {
    if (false === (this instanceof site.Customer)) throw new Error('new operator required');
    args = args || {};
    if (!args.attributes) {
      args.attributes = [];
    }
    args.attributes.push(new tgi.Attribute({name: 'Customer', type: 'String(50)', validationRule: {required: true}}));
    args.attributes.push(new tgi.Attribute({name: 'Address1', label: 'Address', type: 'String(50)', validationRule: {required: true}}));
    args.attributes.push(new tgi.Attribute({name: 'Address2', label: 'Address 2', type: 'String(50)', placeHolder: '(if additional line needed for address)', hidden: '*'}));
    args.attributes.push(new tgi.Attribute({name: 'City', type: 'String(35)', validationRule: {required: true}}));
    args.attributes.push(new tgi.Attribute({name: 'State', type: 'String(2)', hidden: '*', validationRule: {required: true}}));
    args.attributes.push(new tgi.Attribute({name: 'Zip', type: 'String(10)', placeHolder: '#####-####', hidden: '*'}));
    args.attributes.push(new tgi.Attribute({name: 'County', type: 'String(25)', quickPick: site.countySource, hidden: '*'}));
    args.attributes.push(new tgi.Attribute({name: 'CrossStreet', label: 'Cross Street', type: 'String(50)', placeHolder: 'nearest intersecting street to address', hidden: '*'}));
    args.attributes.push(new tgi.Attribute({name: 'Contact', type: 'String(50)', placeHolder: '(any additional contact info)', hidden: '*'}));
    args.attributes.push(new tgi.Attribute({name: 'HomePhone', label: 'Home Phone', type: 'String(25)', placeHolder: '###-###-####', hidden: '*'}));
    args.attributes.push(new tgi.Attribute({name: 'WorkPhone', label: 'Work Phone', type: 'String(25)', placeHolder: '###-###-####', hidden: '*'}));
    args.attributes.push(new tgi.Attribute({name: 'CellPhone', label: 'Cell Phone', type: 'String(25)', placeHolder: '###-###-####', hidden: '*'}));
    args.attributes.push(new tgi.Attribute({name: 'Email', type: 'String(50)', hidden: '*'}));
    args.attributes.push(new tgi.Attribute({name: 'Source', type: 'String(25)', placeHolder: 'How did they find us?', quickPick: site.customerSource, validationRule: {required: true}, hidden: '*'}));
    args.attributes.push(new tgi.Attribute({name: 'Comments', type: 'String(255)', placeHolder: '(General comments about customer not work order)', hidden: '*'}));
    tgi.Model.call(this, args);
    this.modelType = "Customer";
    this.set('State', 'GA');
  };
  site.Customer.prototype = Object.create(tgi.Model.prototype);
}());

/**---------------------------------------------------------------------------------------------------------------------
 * field-service/source/models/invoice.js
 */
(function () {
  site.Invoice = function (args) {
    if (false === (this instanceof site.Invoice)) throw new Error('new operator required');
    args = args || {};
    if (!args.attributes) {
      args.attributes = [];
    }
    args.attributes.push(new tgi.Attribute({name: 'CustomerID', type: 'ID', hidden: '*'}));
    args.attributes.push(new tgi.Attribute({name: 'CustomerIssues', label: 'Customer Issues', type: 'String(255)', validationRule: {required: true}}));
    args.attributes.push(new tgi.Attribute({name: 'Emergency', type: 'Boolean'}));
    args.attributes.push(new tgi.Attribute({name: 'UtilityLocate', label: 'Utility Locate', type: 'Boolean'}));
    args.attributes.push(new tgi.Attribute({name: 'UtilityReference', label: 'Utility Ref #', type: 'String(20)'}));
    args.attributes.push(new tgi.Attribute({name: 'ServiceDate', label: 'Service Date', type: 'Date'}));
    args.attributes.push(new tgi.Attribute({name: 'PrimaryTechID', label: 'Primary Tech', type: 'ID', hidden: '*'}));
    args.attributes.push(new tgi.Attribute({name: 'SecondaryTechID', label: 'Secondary Tech', type: 'ID', hidden: '*'}));
    args.attributes.push(new tgi.Attribute({name: 'InvoiceNumber', label: 'Invoice #', type: 'String(8)'}));
    args.attributes.push(new tgi.Attribute({name: 'InvoiceAmount', label: 'Amount $', type: 'Number', hidden: '*'}));
    args.attributes.push(new tgi.Attribute({name: 'TankPumped', label: 'Tank Pumped', type: 'Boolean', hidden: '*'}));
    args.attributes.push(new tgi.Attribute({name: 'Comments', label: 'Tech Notes', type: 'String(255)', hidden: '*'}));
    tgi.Model.call(this, args);
    this.modelType = "Invoice";
    this.set('UtilityLocate', false);
    this.set('TankPumped', false);
    this.set('Emergency', false);
  };
  site.Invoice.prototype = Object.create(tgi.Model.prototype);
}());

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
  fixIt();
}, options);

function fixIt() {
  var recno = 0;
  var fixno = 0;
  mongoStore.getList(new tgi.List(new site.Invoice()), {}, function (invoiceList, error) {
    if (error) {
      console.log('error loading invoice: ' + error);
    } else {
      if (invoiceList.moveFirst()) {
        checkRow();
      }
      else {
        console.log('no records to process');
        process.exit(1);
      }
    }
    function checkRow() {
      recno++;
      if (!(recno % 100))
        console.log('on rec #' + recno);
      var fixIt = false;
      var InvoiceNumber = invoiceList.get('InvoiceNumber');
      var UtilityReference = invoiceList.get('UtilityReference');
      var UtilityLocate = invoiceList.get('UtilityLocate');
      var Emergency = invoiceList.get('Emergency');
      var TankPumped = invoiceList.get('TankPumped');
      var ServiceDate = invoiceList.get('ServiceDate');

      var ServiceYear = 0;
      var ServiceMonth = 0;
      if (ServiceDate) {
        ServiceYear = ServiceDate.getFullYear();
        ServiceMonth = 1 + ServiceDate.getMonth();
      }
      //console.log(
      //  'InvoiceNumber: ' + InvoiceNumber +
      //  ' UtilityLocate: ' + UtilityLocate +
      //  ' Emergency: ' + Emergency +
      //  ' TankPumped: ' + TankPumped +
      //  ' ServiceDate: ' + ServiceDate +
      //  ' ServiceYear: ' + ServiceYear +
      //  ' ServiceMonth: ' + ServiceMonth);

      //if (ServiceYear < 2016 && ServiceMonth < 3) {
      //  if (!UtilityLocate)
      //    fixIt = true;
      //} else {
      //  if (InvoiceNumber === null || InvoiceNumber === '') {
      //    if (UtilityLocate)
      //      fixIt = true;
      //  } else {
      //    if (!UtilityLocate)
      //      fixIt = true;
      //  }
      //}

      if (typeof(UtilityLocate) !== "boolean")
        fixIt = true;
      if (typeof(Emergency) !== "boolean")
        fixIt = true;
      if (typeof(TankPumped) !== "boolean")
        fixIt = true;
      if (typeof(UtilityReference) !== "string")
        fixIt = true;



      if (fixIt)
        fixRow();
      else
        nextRow();
    }

    function fixRow() {
      fixno++;
      var invoice = new site.Invoice();

      invoice.set('id', invoiceList.get('id'));
      invoice.set('CustomerID', invoiceList.get('CustomerID'));
      invoice.set('CustomerIssues', invoiceList.get('CustomerIssues') || '');
      invoice.set('Emergency', invoiceList.get('Emergency') || false);
      invoice.set('UtilityLocate', invoiceList.get('UtilityLocate') || false);
      invoice.set('UtilityReference', invoiceList.get('UtilityReference') || '');
      invoice.set('ServiceDate', invoiceList.get('ServiceDate'));
      invoice.set('PrimaryTechID', invoiceList.get('PrimaryTechID'));
      invoice.set('SecondaryTechID', invoiceList.get('SecondaryTechID'));
      invoice.set('InvoiceNumber', invoiceList.get('InvoiceNumber') || '');
      invoice.set('InvoiceAmount', invoiceList.get('InvoiceAmount') || 0);
      invoice.set('TankPumped', invoiceList.get('TankPumped') || false);
      invoice.set('Comments', invoiceList.get('Comments') || '');

      var ServiceDate = invoiceList.get('ServiceDate');
      if (ServiceDate) {
        var ServiceYear = ServiceDate.getFullYear();
        var ServiceMonth = 1 + ServiceDate.getMonth();
        if (ServiceYear < 2016 || ServiceMonth < 3)
          invoice.set('UtilityLocate', true);
      } else {
        if (invoice.get('InvoiceNumber') != '')
          invoice.set('UtilityLocate', true);
      }

      mongoStore.putModel(invoice, function (model, error) {
        if (error) {
          console.log('putModel error: ' + error);
          process.exit(1);
        } else {
          //console.log('fixed');
          nextRow();
        }
      });
    }

    function nextRow() {
      if (invoiceList.moveNext()) {
        setTimeout(function () {
          checkRow();
        }, 0);
      } else {
        console.log('processed records:  ' + recno);
        console.log('fixed records:  ' + fixno);

        process.exit(1);
      }
    }
  });

}