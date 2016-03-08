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
    var tech1ID = new tgi.Attribute.ModelID(new site.Tech());
    args.attributes.push(new tgi.Attribute({name: 'CustomerID', type: 'ID', hidden: '*'}));
    args.attributes.push(new tgi.Attribute({name: 'CustomerIssues', label: 'Customer Issues', type: 'String(255)', validationRule: {required: true}}));
    args.attributes.push(new tgi.Attribute({name: 'Emergency', type: 'Boolean'}));
    args.attributes.push(new tgi.Attribute({name: 'UtilityLocate', label: 'Utility Locate', type: 'Boolean', hidden: '*'}));
    args.attributes.push(new tgi.Attribute({name: 'ServiceDate', label: 'Service Date', type: 'Date'}));
    args.attributes.push(new tgi.Attribute({name: 'PrimaryTechID', label: 'Primary Tech', type: 'ID', hidden: '*'}));
    args.attributes.push(new tgi.Attribute({name: 'SecondaryTechID', label: 'Secondary Tech', type: 'ID', hidden: '*'}));
    args.attributes.push(new tgi.Attribute({name: 'InvoiceNumber', label: 'Invoice #', type: 'String(8)'}));
    args.attributes.push(new tgi.Attribute({name: 'InvoiceAmount', label: 'Amount $', type: 'Number', hidden: '*'}));
    args.attributes.push(new tgi.Attribute({name: 'TankPumped', label: 'Tank Pumped', type: 'Boolean', hidden: '*'}));
    args.attributes.push(new tgi.Attribute({name: 'Comments', label: 'Tech Notes', type: 'String(255)', hidden: '*'}));
    tgi.Model.call(this, args);
    this.modelType = "Invoice";
    //this.set('ServiceDate', new Date());
  };
  site.Invoice.prototype = Object.create(tgi.Model.prototype);
}());
