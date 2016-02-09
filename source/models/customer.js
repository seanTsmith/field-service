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
    args.attributes.push(new tgi.Attribute({name: 'name', type: 'String(50)'}));
    args.attributes.push(new tgi.Attribute({name: 'firstName', type: 'String(35)'}));
    args.attributes.push(new tgi.Attribute({name: 'address1', type: 'String(50)'}));
    args.attributes.push(new tgi.Attribute({name: 'city', type: 'String(35)'}));
    args.attributes.push(new tgi.Attribute({name: 'state', type: 'String(2)'}));
    args.attributes.push(new tgi.Attribute({name: 'zip', type: 'String(10)'}));
    args.attributes.push(new tgi.Attribute({name: 'invoice', type: 'String(10)'}));
    tgi.Model.call(this, args);
    this.modelType = "Customer";
  };
  site.Customer.prototype = Object.create(tgi.Model.prototype);
}());