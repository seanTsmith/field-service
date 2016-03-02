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
    args.attributes.push(new tgi.Attribute({name: 'CustomerIssues', label: 'Customer Issues', type: 'String(255)'}));
    args.attributes.push(new tgi.Attribute({name: 'Emergency', type: 'Boolean'}));
    args.attributes.push(new tgi.Attribute({name: 'UtilityLocate', label: 'Utility Locate', type: 'Boolean'}));
    args.attributes.push(new tgi.Attribute({name: 'ServiceDate', type: 'Date'}));
    args.attributes.push(new tgi.Attribute({name: 'InvoiceNumber', type: 'String(8)'}));
    args.attributes.push(new tgi.Attribute({name: 'TankPumped', label: 'Tank Pumped', type: 'Boolean'}));
    args.attributes.push(new tgi.Attribute({name: 'Comments', label: 'Tech Notes', type: 'String(255)'}));
    tgi.Model.call(this, args);
    this.modelType = "Invoice";
    this.set('ServiceDate',Date.now());
  };
  site.Invoice.prototype = Object.create(tgi.Model.prototype);
}());
