/**---------------------------------------------------------------------------------------------------------------------
 * field-service/source/commands/schedule/workOrders.js
 */
var designToDo_ui = ui;

(function () {
  var self = this;
  self.viewState = 'LIST';
  var workOrderPresentation = new tgi.Presentation();
  workOrderPresentation.preRenderCallback = function (command, callback) {
    self.presentation = command.contents;
    self.callback = callback;
    self.command = command;
    self.contents = [];
    switch (self.viewState) {
      //case 'ORDER':
      //  renderOrder();
      //  break;
      case 'LIST':
        try {
          renderList();
        } catch (e) {
          app.err('renderList(' + e + ')')
        }

        break;
      default:
        self.contents.push('UNKNOWN VIEW STATE ' + self.viewState);
        callbackDone();
        break;
    }
  };
  var workOrderCommand = new tgi.Command({
    name: 'Work Orders',
    theme: 'warning',
    type: 'Presentation',
    icon: 'fa-truck',
    contents: workOrderPresentation
  });
  site.scheduleMenu.push(workOrderCommand);
  /**
   * Model for our list view
   */
  var LocateOrder = function (args) {
    if (false === (this instanceof LocateOrder)) throw new Error('new operator required');
    args = args || {};
    if (!args.attributes) {
      args.attributes = [];
    }
    args.attributes.push(new tgi.Attribute({name: 'Techs', label: 'Assigned', type: 'String'}));
    args.attributes.push(new tgi.Attribute({name: 'Emergency', label: '*', type: 'Boolean'}));
    args.attributes.push(new tgi.Attribute({name: 'ServiceDate', label: 'Service Date', type: 'Date'}));
    args.attributes.push(new tgi.Attribute({name: 'Customer', type: 'String'}));
    args.attributes.push(new tgi.Attribute({name: 'City', type: 'String'}));
    args.attributes.push(new tgi.Attribute({name: 'Address', type: 'String'}));
    tgi.Model.call(this, args);
    this.modelType = "LocateOrder";
  };
  LocateOrder.prototype = Object.create(tgi.Model.prototype);

  /**
   * Callback after async ops done
   */
  function callbackDone() {
    self.presentation.set('contents', self.contents);
    self.callback(self.command);
  }

  /**
   * Render the list
   */
  function renderList() {
    var listView = new tgi.List(new LocateOrder());

    /**
     * Fetch each order where utility locate has not been done
     */
    var daList = new tgi.List(new site.Invoice());
    console.log('what da fuck yo');
    site.hostStore.getList(daList, {UtilityLocate: true, InvoiceNumber: ''}, function (invoiceList, error) {
      if (error) {
        console.log('error loading invoice: ' + error);
      } else {
        if (invoiceList.moveFirst()) {
          function populateRow() {
            /**
             * Get tech names
             */
            var tech1, tech2;
            var primaryTechID = invoiceList.get('PrimaryTechID');
            var secondaryTechID = invoiceList.get('SecondaryTechID');
            for (var i = 0; i < site.techID.length; i++) {
              var techID = site.techID[i];
              if (techID) {
                if (techID == primaryTechID) tech1 = site.techList[i];
                if (techID == secondaryTechID) tech2 = site.techList[i];
              }
            }
            var techs = (tech1 || '') + (tech2 ? ('/' + tech2) : '');
            /**
             * Get customer
             */
            var customer = new site.Customer();
            customer.set('id', invoiceList.get('CustomerID'));
            site.hostStore.getModel(customer, function (model, error) {
              customer = model;
              listView.addItem(new LocateOrder());
              listView.set('id', invoiceList.get('id'));
              listView.set('Emergency', invoiceList.get('Emergency'));
              listView.set('ServiceDate', invoiceList.get('ServiceDate'));
              if (techs)
                listView.set('techs', techs);
              if (error) {
                app.err('getModel error: ' + error);
              } else {
                listView.set('Customer', customer.get('Customer'));
                listView.set('City', customer.get('City'));
                listView.set('Address', customer.get('Address1'));
              }
              if (invoiceList.moveNext()) {
                setTimeout(function () {
                  populateRow();
                }, 0);
              } else {
                listView.sort({ServiceDate:1});
                self.contents.push(listView);
                callbackDone();
              }
            });
          }

          populateRow();
        } else {
          self.contents.push('### No orders found that need utility locate');
          callbackDone();
        }
      }
    });

    /**
     * When user selects from list
     */
    listView.pickKludge = function (id) {
      var items = listView._items;
      self.orderID = null;
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (id == item[0]) {
          self.orderID = id;
          //self.viewState = 'ORDER';
          //command.execute(designToDo_ui);
        }
      }
      if (self.orderID) {
        app.choose('Assign primary tech', site.techList, function (choice) {
          if (choice !== undefined)
            setPrimaryTech(choice)
        });
      } else {
        app.err('error locating order');
      }
    };
    /**
     * Set primary tech by name
     */
    function setPrimaryTech(name) {

      /**
       * Get tech ID from name
       */
      var techID;
      for (var i = 0; i < site.techID.length; i++)
        if (name == site.techList[i])
          techID = site.techID[i];

      if (techID === undefined) {
        app.err('Cannot locate tech ID ');
        return;
      }

      /**
       * Get invoice
       */
      var invoice = new site.Invoice();
      invoice.set('id', self.orderID);
      site.hostStore.getModel(invoice, function (model, error) {
        invoice.set('PrimaryTechID', techID);
        if (error) {
          app.err('invoice  getModel error: ' + error);
          return;
        }
        site.hostStore.putModel(invoice, function (model, error) {
          if (error) {
            app.err('Error saving invoice: ' + error);
          } else {
            command.execute(designToDo_ui);
          }
        });
      });
    }
  }


  /**
   * force
   */
  //setTimeout(function () {
  //  workOrderCommand.execute(ui);
  //}, 100);

}());