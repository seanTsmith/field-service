/**---------------------------------------------------------------------------------------------------------------------
 * field-service/source/models/customer.js
 */

(function () {
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
}());