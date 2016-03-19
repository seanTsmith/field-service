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
    'Clayton',
    'Cobb',
    'Coweta',
    'DeKalb',
    'Douglas',
    'Fayette',
    'Fulton',
    'Henry',
    'Gwinnett',
    'Newton',
    'Rockdale',
    'Walton'
  ];

  site.citySource = [
    'Acworth',
    'Alpharetta',
    'Atlanta',
    'Auburn',
    'Austell',
    'Avondale Estates',
    'Blairsville',
    'Bowdon',
    'Braselton',
    'Bremen',
    'Buford',
    'Canton',
    'Carrollton',
    'Cartersville',
    'Cedartown',
    'Chamblee',
    'Clarkston',
    'College Park',
    'Conyers',
    'Covington',
    'Cumming',
    'Dacula',
    'Dallas',
    'Decatur',
    'Doraville',
    'Douglasville',
    'Duluth',
    'Dunwoody',
    'East Point',
    'Ellenwood',
    'Ellijay',
    'Fairburn',
    'Fayette',
    'Fayetteville',
    'Flowery Branch',
    'Forest Park',
    'Glen Haven',
    'Grayson',
    'Greensboro',
    'Hampton',
    'Hapeville',
    'Hiram',
    'Jasper',
    'Johns Creek',
    'Jonesboro',
    'Kennesaw',
    'Lake Lanier Islands',
    'Lawrenceville',
    'Lilburn',
    'Lithia Springs',
    'Lithonia',
    'Locust Grove',
    'Loganville',
    'Mableton',
    'Marble Hill',
    'Marblehill',
    'Marietta',
    'McDonough',
    'Milton',
    'Monticello',
    'Morrow',
    'Newnan',
    'Newtown',
    'Norcross',
    'Peachtree City',
    'Powder Springs',
    'Riverdale',
    'Rockmart',
    'Roswell',
    'Sandy Springs',
    'Scottdale',
    'Senoia',
    'Smyrna',
    'Snellville',
    'Stockbridge',
    'Stone Mountain',
    'Sunny Side',
    'Suwanee',
    'Tallapoosa',
    'Tucker',
    'Tyrone',
    'Union City',
    'Villa Rica',
    'Vinings',
    'Westoak',
    'Woodstock'
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
    args.attributes.push(new tgi.Attribute({name: 'City', type: 'String(35)', quickPick: site.citySource, validationRule: {required: true}}));
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
  /**
   * Helper loads map in new window based on passed ID
   */
  site.Customer.Map = function (id) {

    var address = '';

    /**
     * Get customer
     */
    var customer = new site.Customer();
    customer.set('id', id);
    site.hostStore.getModel(customer, function (model, error) {
      customer = model;
      if (error) {
        app.err('getModel error: ' + error);
      } else {
        app.info('Loading map, make sure popup not blocked...');
        var zip = customer.get('zip') ?  ' ' + customer.get('zip') : '';
        address = '' + customer.get('Address1') + ', '+ customer.get('City') + ', '+ customer.get('State') + zip;
        //console.log('address: ' + address);
      }
      var url = 'http://www.bing.com/maps/default.aspx?where1=' + address;
      //console.log(url);
      window.open(url, '_blank');
    });
  }

}());