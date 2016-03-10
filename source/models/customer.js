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
    this.set('State','GA');
  };
  site.Customer.prototype = Object.create(tgi.Model.prototype);
}());