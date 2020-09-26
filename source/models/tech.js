/**---------------------------------------------------------------------------------------------------------------------
 * field-service/source/models/tech.js
 */

(function () {
  site.Tech = function (args) {
    if (false === (this instanceof site.Tech)) throw new Error('new operator required');
    args = args || {};
    if (!args.attributes) {
      args.attributes = [];
    }
    args.attributes.push(new tgi.Attribute({name: 'Name', type: 'String(25)', validationRule: {required: true}}));
    args.attributes.push(new tgi.Attribute({name: 'CellPhone', type: 'String(25)', placeHolder: '###-###-####'}));
    args.attributes.push(new tgi.Attribute({name: 'Email', type: 'String(50)'}));
    args.attributes.push(new tgi.Attribute({name: 'Inactive', label: 'Inactive', type: 'Boolean'}));
    tgi.Model.call(this, args);
    this.modelType = "Tech";
  };
  site.Tech.prototype = Object.create(tgi.Model.prototype);
}());