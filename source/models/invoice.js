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
    args.attributes.push(new tgi.Attribute({name: 'CustomerID', type: 'ID'}));
    args.attributes.push(new tgi.Attribute({name: 'InvoiceNumber', type: 'String(8)'}));
    args.attributes.push(new tgi.Attribute({name: 'ServiceDate', type: 'Date'}));
    args.attributes.push(new tgi.Attribute({name: 'TankPumped', type: 'Boolean'}));
    args.attributes.push(new tgi.Attribute({name: 'Comments', type: 'String'}));
    tgi.Model.call(this, args);
    this.modelType = "Invoice";
  };
  site.Invoice.prototype = Object.create(tgi.Model.prototype);
}());
