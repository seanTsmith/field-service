/**---------------------------------------------------------------------------------------------------------------------
 * field-service/source/commands/schedule/utilityLocate.js
 */
var designToDo_ui = ui;

(function () {
  var self = this;
  self.viewState = 'LIST';
  var utilityLocatePresentation = new tgi.Presentation();
  utilityLocatePresentation.preRenderCallback = function (command, callback) {
    self.presentation = command.contents;
    self.callback = callback;
    self.command = command;
    self.contents = [];
    switch (self.viewState) {
      case 'ORDER':
        renderOrder();
        break;
      case 'LIST':
        renderList();
        break;
      default:
        self.contents.push('UNKNOWN VIEW STATE ' + self.viewState);
        callbackDone();
        break;
    }
  };
  var utilityLocateCommand = new tgi.Command({
    name: 'Utility Locate',
    theme: 'warning',
    type: 'Presentation',
    icon: 'fa-warning',
    contents: utilityLocatePresentation
  });
  site.scheduleMenu.push(utilityLocateCommand);

  /**
   * Model for our list view
   */
  var LocateOrder = function (args) {
    if (false === (this instanceof LocateOrder)) throw new Error('new operator required');
    args = args || {};
    if (!args.attributes) {
      args.attributes = [];
    }
    args.attributes.push(new tgi.Attribute({name: 'UtilityReference', label: 'Utility Ref #', type: 'String(20)'}));
    args.attributes.push(new tgi.Attribute({name: 'ServiceDate', label: 'Service Date', type: 'Date'}));
    args.attributes.push(new tgi.Attribute({name: 'County', type: 'String(25)'}));
    args.attributes.push(new tgi.Attribute({name: 'City', type: 'String(35)'}));
    args.attributes.push(new tgi.Attribute({name: 'Address', label: 'Address', type: 'String(50)'}));
    args.attributes.push(new tgi.Attribute({name: 'CrossStreet', label: 'Cross Street', type: 'String(50)'}));
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
    app.info('Locating please wait ...');
    var listView = new tgi.List(new LocateOrder());
    /**
     * Fetch each order where utility locate has not been done
     */
    site.hostStore.getList(new tgi.List(new site.Invoice()), {UtilityLocate: false}, {id:1}, function (invoiceList, error) {
      if (error) {
        console.log('error loading invoice: ' + error);
      } else {
        if (invoiceList.moveFirst()) {
          function populateRow() {
            var customer = new site.Customer();
            customer.set('id', invoiceList.get('CustomerID'));
            site.hostStore.getModel(customer, function (model, error) {
              customer = model;
              listView.addItem(new LocateOrder());
              listView.set('id', invoiceList.get('id'));
              listView.set('UtilityReference', invoiceList.get('UtilityReference'));
              listView.set('ServiceDate', invoiceList.get('ServiceDate'));
              if (error) {
                app.err('getModel error: ' + error);
              } else {
                listView.set('County', customer.get('County'));
                listView.set('City', customer.get('City'));
                listView.set('Address', customer.get('Address1'));
                listView.set('CrossStreet', customer.get('CrossStreet'));
              }
              if (invoiceList.moveNext()) {
                setTimeout(function () {
                  populateRow();
                }, 0);
              } else {
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
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (id == item[0]) {
          self.orderID = id;
          self.viewState = 'ORDER';
          command.execute(designToDo_ui);
        }
      }
    };
  }

  /**
   * Render the order
   */
  function renderOrder() {
    self.command.presentationMode = 'Edit';
    var customer = new site.Customer();
    var invoice = new site.Invoice();

    invoice.set('id', self.orderID);
    site.hostStore.getModel(invoice, function (model, error) {
      invoice = model;
      if (error) {
        self.contents.push('Error loading invoice: ' + error);
        finishUp();
      } else {
        customer.set('id', invoice.get('CustomerID'));
        site.hostStore.getModel(customer, function (model, error) {
          customer = model;
          if (error) {
            self.contents.push('Error loading customer: ' + error);
            finishUp();
          } else {
            renderInfo();
          }
        });
      }
    });

    function renderInfo() {
      self.contents.push('#### Customer: ' + customer.get('Customer'));
      self.contents.push('Make any corrections to address info:');
      self.contents.push(customer.attribute('County'));
      self.contents.push(customer.attribute('City'));
      self.contents.push(customer.attribute('Address1'));
      self.contents.push(customer.attribute('CrossStreet'));
      self.contents.push('-');
      self.contents.push('Enter info from utility locate service:');
      self.contents.push(invoice.attribute('UtilityLocate'));
      self.contents.push(invoice.attribute('UtilityReference'));
      self.contents.push(invoice.attribute('ServiceDate'));
      self.contents.push('-');
      self.contents.push(new tgi.Command({
        name: 'Save Changes',
        theme: 'success',
        icon: 'fa-check-circle',
        type: 'Function',
        contents: function () {
          self.presentation.validate(function () {
            if (self.presentation.validationMessage) {
              app.warn('Please correct: ' + attributePresentation.validationMessage);
            } else {
              saveInfo();
            }
          })
        }
      }));
      finishUp();
    }

    /**
     * Save model
     */
    function saveInfo() {
      site.hostStore.putModel(invoice, function (model, error) {
        if (error) {
          app.err('Error saving invoice: ' + error);
        } else {
          site.hostStore.putModel(customer, function (model, error) {
            if (error) {
              app.err('Error saving customer: ' + error);
            } else {
              self.viewState = 'LIST';
              command.execute(designToDo_ui);
            }
          });
        }
      });
    }

    function finishUp() {
      // self.orderID
      self.contents.push(new tgi.Command({
        name: 'Back',
        icon: 'fa-undo',
        type: 'Function',
        contents: function () {
          self.viewState = 'LIST';
          command.execute(designToDo_ui);
        }
      }));
      callbackDone();
    }
  }

  /**
   * force
   */
  //setTimeout(function () {
  //  utilityLocateCommand.execute(ui);
  //}, 100);

}());