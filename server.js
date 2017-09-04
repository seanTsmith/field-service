/**---------------------------------------------------------------------------------------------------------------------
 * tgi.io/www.tgi.io/server.js
 *
 * First setup express server
 */
var site = {};
var express = require("express");
var app = express();
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');
var methodOverride = require('method-override');
var serveStatic = require('serve-static');
var serveIndex = require('serve-index');
// var download = require('download');
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(serveStatic('public'));
// app.use(serveIndex('public', {icons: true}));
app.use(serveStatic('source'));
//app.use(serveIndex('source', {icons: true}));
app.use(serveStatic('import'));
app.use(errorHandler({dumpExceptions: true, showStack: true}));

app.use(function (req, res, next) { // 404 equiv
  console.log('req is ' + req);
  res.sendFile(__dirname + '/public/application.html');
});

/**
 * Get our IP
 */
var os = require('os');
var interfaces = os.networkInterfaces();
var addresses = [];
var k, k2;
for (k in interfaces) {
  for (k2 in interfaces[k]) {
    var address = interfaces[k][k2];
    if (address.family == 'IPv4' && !address.internal) {
      addresses.push(address.address)
    }
  }
}

/**
 * Start Server
 */
var IP = addresses[0];
var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var hostname = process.env.OPENSHIFT_NODEJS_IP || IP;
var server = app.listen(port, hostname, function () {
  console.log('server listening on: http://' + hostname + ':' + port);
});

/**
 * tgi lib
 */
var TGI = require('./server.lib.js');
var tgi = TGI.CORE();

/**
 * Customer Table (client also!)
 */
site.Customer = function (args) {
  if (false === (this instanceof site.Customer)) throw new Error('new operator required');
  args = args || {};
  if (!args.attributes) {
    args.attributes = [];
  }
  args.attributes.push(new tgi.Attribute({name: 'Customer', type: 'String(50)', validationRule: {required: true}}));
  args.attributes.push(new tgi.Attribute({name: 'Address1', label: 'Address', type: 'String(50)', validationRule: {required: true}}));
  args.attributes.push(new tgi.Attribute({name: 'Address2', label: 'Address 2', type: 'String(50)', placeHolder: '(if additional line needed for address)', hidden: '*'}));
  args.attributes.push(new tgi.Attribute({name: 'City', type: 'String(35)', quickPick: site.citySource, validationRule: {required: true}}));
  args.attributes.push(new tgi.Attribute({name: 'State', type: 'String(2)', hidden: '*', validationRule: {required: true}}));
  args.attributes.push(new tgi.Attribute({name: 'Zip', type: 'String(10)', placeHolder: '#####-####', hidden: '*'}));
  args.attributes.push(new tgi.Attribute({name: 'County', type: 'String(25)', quickPick: site.countySource, hidden: '*'}));
  args.attributes.push(new tgi.Attribute({name: 'CrossStreet', label: 'Cross Street', type: 'String(50)', placeHolder: 'nearest intersecting street to address', hidden: '*'}));
  args.attributes.push(new tgi.Attribute({name: 'Contact', type: 'String(50)', placeHolder: '(any additional contact info)'}));
  args.attributes.push(new tgi.Attribute({name: 'HomePhone', label: 'Home Phone', type: 'String(25)', placeHolder: '###-###-####', hidden: '*'}));
  args.attributes.push(new tgi.Attribute({name: 'WorkPhone', label: 'Work Phone', type: 'String(25)', placeHolder: '###-###-####', hidden: '*'}));
  args.attributes.push(new tgi.Attribute({name: 'CellPhone', label: 'Cell Phone', type: 'String(25)', placeHolder: '###-###-####', hidden: '*'}));
  args.attributes.push(new tgi.Attribute({name: 'Email', type: 'String(50)', hidden: '*'}));
  args.attributes.push(new tgi.Attribute({name: 'Source', type: 'String(25)', placeHolder: 'How did they find us?', quickPick: site.customerSource, validationRule: {required: true}, hidden: '*'}));
  args.attributes.push(new tgi.Attribute({name: 'Comments', type: 'String(255)', placeHolder: '(General comments about customer not work order)', hidden: '*'}));
  args.attributes.push(new tgi.Attribute({name: 'CompanyGroup', label: 'Third Party Billing', type: 'Boolean', hidden: '*'}));
  tgi.Model.call(this, args);
  this.modelType = "Customer";
  this.set('State', 'GA');
};
site.Customer.prototype = Object.create(tgi.Model.prototype);

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
    //process.exit(1);
  } else {
    console.log('mongoStore connected');
  }
  console.log(mongoStore.name + ' ' + mongoStore.storeType);
}, options);

/**
 * Attach host store to mongo store
 */
tgi.Transport.hostStore = mongoStore;
site.hostStore = mongoStore;

/**
 * Start up socket server (io)
 */
var io = require('socket.io').listen(server);
var socketWas;
io.on('connection', function (socket) {
  socketWas = socket;
  console.log('socket.io connection: ' + socket.id);
  socket.on('ackmessage', tgi.Transport.hostMessageProcess);
  // socket.on('message', inbound);
  socket.on('disconnect', function (reason) {
    console.log('message socket.io disconnect: ' + reason);
  });
  socket.send('wassup');
});

/**
 * App specific messages
 */
function inbound(msg) {
  switch (msg) {
    case 'exportCustomersCommand':
      exportCustomersCommand();
      break;
    default:
      console.log('inbound (unknown command): ' + msg);
  }
}

/**
 * exportCustomersCommand
 */
function exportCustomersCommand() {
  var module = {};
  module.csvData = [];
  console.log('exportCustomersCommand invoked');

  download('unicorn.com/foo.jpg').pipe(fs.createWriteStream('dist/foo.jpg'));

  var customers = new tgi.List(new site.Customer());
  site.hostStore.getList(customers, {}, {}, function (customerList, error) {
    if (error) {
      app.err('Customer getList error: ' + error);
      return;
    }
    // /**
    //  * Now get all orders
    //  */
    // var orders = new tgi.List(new site.Invoice());
    // site.hostStore.getList(orders, {}, {}, function (orderList, error) {
    //   if (error) {
    //     app.err('Invoice getList error: ' + error);
    //     return;
    //   }
    //   var gotMore = orderList.moveFirst();
    //   while (gotMore) {
    //     gotMore = orderList.moveNext();
    //   }

    /**
     * Create CSV struct from customers
     */
    var gotMore = customerList.moveFirst();
    var count = 0;
    while (count++ >= 0 && gotMore) {
      var customerFields =
        [
          'Customer',
          'Address1',
          'Address2',
          'City',
          'State',
          'Zip',
          'County',
          'CrossStreet',
          'Contact',
          'HomePhone',
          'WorkPhone',
          'CellPhone',
          'Email',
          'Source',
          'Comments',
          'CompanyGroup'
        ];
      var pushMe = {};
      for (var i = 0; i < customerFields.length; i++) {
        var fld = customerFields[i];
        pushMe[fld] = customerList.get(fld);

      }
      module.csvData.push(pushMe);
      gotMore = customerList.moveNext();
    }
    console.log('count is ' + count);

    /**
     * Done...
     */
    console.log('BOOH');
    socketWas.send('exportCustomersCommandOK');

  });

}

/**
 * All Done
 */
console.log('server initialized ' + new Date());
