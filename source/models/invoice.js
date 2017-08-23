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
    args.attributes.push(new tgi.Attribute({name: 'Address1', label: 'Address', type: 'String(50)', validationRule: {required: true}}));
    args.attributes.push(new tgi.Attribute({name: 'Address2', label: 'Address 2', type: 'String(50)', placeHolder: '(if additional line needed for address)', hidden: '*'}));
    args.attributes.push(new tgi.Attribute({name: 'City', type: 'String(35)', quickPick: site.citySource, validationRule: {required: true}}));
    args.attributes.push(new tgi.Attribute({name: 'State', type: 'String(2)', hidden: '*', validationRule: {required: true}}));
    args.attributes.push(new tgi.Attribute({name: 'Zip', type: 'String(10)', placeHolder: '#####-####', hidden: '*'}));
    args.attributes.push(new tgi.Attribute({name: 'County', type: 'String(25)', quickPick: site.countySource, hidden: '*'}));
    args.attributes.push(new tgi.Attribute({name: 'CrossStreet', label: 'Cross Street', type: 'String(50)', placeHolder: 'nearest intersecting street to address', hidden: '*'}));
    args.attributes.push(new tgi.Attribute({name: 'Contact', type: 'String(50)', placeHolder: '(location contact)', validationRule: {required: true}}));
    args.attributes.push(new tgi.Attribute({name: 'ContactPhone', label: 'Contact Phone', type: 'String(25)', placeHolder: '###-###-####', hidden: '*'}));
    args.attributes.push(new tgi.Attribute({name: 'Emergency', type: 'Boolean'}));
    args.attributes.push(new tgi.Attribute({name: 'TankPumped', label: 'Pump 1000 gal', type: 'Boolean', hidden: '*'}));
    args.attributes.push(new tgi.Attribute({name: 'TankPumped1500', label: 'Pump 1500 gal', type: 'Boolean', hidden: '*'}));
    args.attributes.push(new tgi.Attribute({name: 'CustomerIssues', label: 'Customer Issues', type: 'String(255)', validationRule: {required: true}}));
    args.attributes.push(new tgi.Attribute({name: 'UtilityLocate', label: 'Utility Locate', type: 'Boolean'}));
    args.attributes.push(new tgi.Attribute({name: 'UtilityReference', label: 'Utility Ref #', type: 'String(20)'}));
    args.attributes.push(new tgi.Attribute({name: 'ServiceDate', label: 'Service Date', type: 'Date'}));
    args.attributes.push(new tgi.Attribute({name: 'PrimaryTechID', label: 'Primary Tech', type: 'ID', hidden: '*'}));
    args.attributes.push(new tgi.Attribute({name: 'SecondaryTechID', label: 'Secondary Tech', type: 'ID', hidden: '*'}));
    args.attributes.push(new tgi.Attribute({name: 'InvoiceNumber', label: 'Invoice #', type: 'String(8)'}));
    args.attributes.push(new tgi.Attribute({name: 'InvoiceAmount', label: 'Amount $', type: 'Number', hidden: '*'}));
    args.attributes.push(new tgi.Attribute({name: 'Comments', label: 'Tech Notes', type: 'String(255)', hidden: '*'}));
    tgi.Model.call(this, args);
    this.modelType = "Invoice";
    this.set('UtilityLocate',false);
    this.set('TankPumped',false);
    this.set('Emergency',false);
  };
  site.Invoice.prototype = Object.create(tgi.Model.prototype);
}());
