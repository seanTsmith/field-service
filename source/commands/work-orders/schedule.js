/**---------------------------------------------------------------------------------------------------------------------
 * field-service/source/commands/work-orders/schedule.js
 */
var designToDo_ui = ui;

(function () {
  if (!site.loggedIn) {
    return;
  }

  var module = {};
  module.viewState = 'LIST';
  module.ServiceDate = new tgi.Attribute({name: 'ServiceDate', label: 'Service Date', type: 'Date'});
  module.InvoiceNumber = new tgi.Attribute({name: 'InvoiceNumber', label: 'InvoiceNumber', type: 'String'});
  module.ServiceDate.value = new Date();

  var workOrderPresentation = new tgi.Presentation();
  workOrderPresentation.preRenderCallback = function (command, callback) {
    module.presentation = command.contents;
    module.callback = callback;
    module.command = command;
    module.contents = [];
    switch (module.viewState) {
      case 'DATESEARCH':
        try {
          renderDateSearch();
        } catch (e) {
          app.err('renderDateSearch(' + e + ')')
        }
        break;
      case 'INVOICESEARCH':
        try {
          renderInvoiceSearch();
        } catch (e) {
          app.err('renderInvoiceSearch(' + e + ')')
        }
        break;
      case 'LIST':
        try {
          renderList();
        } catch (e) {
          app.err('renderList(' + e + ')')
        }

        break;
      default:
        module.contents.push('UNKNOWN VIEW STATE ' + module.viewState);
        callbackDone();
        break;
    }
  };
  var workOrderCommand = new tgi.Command({
    name: 'Orders',
    theme: 'warning',
    type: 'Presentation',
    icon: 'fa-truck',
    contents: workOrderPresentation
  });
  workOrderCommand.presentationMode = 'Edit';
  // site.workOrderMenu.push(workOrderCommand);
  site.navContents.push(workOrderCommand);

  /**
   * Model for our list view
   */
  var LocateOrder = function (args) {
    if (false === (this instanceof LocateOrder)) throw new Error('new operator required');
    args = args || {};
    if (!args.attributes) {
      args.attributes = [];
    }
    args.attributes.push(new tgi.Attribute({name: 'Techs', label: ' Tech', type: 'String'}));
    args.attributes.push(new tgi.Attribute({name: 'ServiceDate', type: 'Date', hidden: '*'}));
    args.attributes.push(new tgi.Attribute({name: 'Date', type: 'String'}));
    args.attributes.push(new tgi.Attribute({name: 'Customer', type: 'String'}));
    // args.attributes.push(new tgi.Attribute({name: 'Contact', type: 'String'}));
    // args.attributes.push(new tgi.Attribute({name: 'City', type: 'String'}));
    args.attributes.push(new tgi.Attribute({name: 'Address', type: 'String'}));
    args.attributes.push(new tgi.Attribute({name: 'Phone', type: 'String'}));
    args.attributes.push(new tgi.Attribute({name: 'CustomerIssues', label: 'Notes', type: 'String'}));
    args.attributes.push(new tgi.Attribute({name: 'CustomerID', type: 'ID', hidden: '*'}));
    tgi.Model.call(this, args);
    this.modelType = "LocateOrder";
  };
  LocateOrder.prototype = Object.create(tgi.Model.prototype);

  /**
   * Callback after async ops done
   */
  function callbackDone() {
    module.presentation.set('contents', module.contents);
    module.callback(module.command);
  }

  /**
   * Date Search
   */
  function renderDateSearch() {
    module.InvoiceNumber.value = '';
    module.contents.push('Enter the date to show work orders for and press "Select Date" ' +
      'or press "Unscheduled" to show all open work orders ready to be scheduled.');

    module.contents.push('-');
    module.contents.push(module.ServiceDate);
    module.contents.push('-');
    module.contents.push('>');
    module.contents.push(new tgi.Command({
      name: 'Select Date',
      theme: 'default',
      icon: 'fa-calendar',
      type: 'Function',
      contents: function () {
        module.viewState = 'LIST';
        workOrderCommand.execute(designToDo_ui);
      }
    }));
    module.contents.push(new tgi.Command({
      name: 'Unscheduled',
      theme: 'default',
      icon: 'fa-calendar-o',
      type: 'Function',
      contents: function () {
        module.ServiceDate.value = null;
        module.viewState = 'LIST';
        workOrderCommand.execute(designToDo_ui);
      }
    }));
    callbackDone();
  }

  /**
   * Invoice Search
   */
  function renderInvoiceSearch() {

    module.contents.push('Enter the invoice number to search for.');
    module.contents.push('-');
    module.InvoiceNumber.value = '';
    module.contents.push(module.InvoiceNumber);
    module.contents.push('-');
    module.contents.push('>');
    module.contents.push(new tgi.Command({
      name: 'Find Invoice',
      theme: 'default',
      icon: 'fa-search',
      type: 'Function',
      contents: function () {
        module.viewState = 'LIST';
        workOrderCommand.execute(designToDo_ui);
      }
    }));
    module.contents.push(new tgi.Command({
      name: 'Cancel',
      theme: 'default',
      icon: 'fa-undo',
      type: 'Function',
      contents: function () {
        module.InvoiceNumber.value = '';
        // module.ServiceDate.value = null;
        module.viewState = 'LIST';
        workOrderCommand.execute(designToDo_ui);
      }
    }));
    callbackDone();
  }

  /**
   * Render the list
   */
  function renderList() {

    var reportData = [];
    var reportDate = '';
    var daOrder = new LocateOrder();
    if (module.ServiceDate.value)
      daOrder.attribute('Date').hidden = '*';
    else
      daOrder.attribute('CustomerIssues').hidden = '*';
    var listView = new tgi.List(daOrder);

    module.contents.push(new tgi.Command({
      name: 'Today',
      theme: 'default',
      icon: 'fa-calendar',
      type: 'Function',
      contents: function () {
        module.InvoiceNumber.value = '';
        module.ServiceDate.value = new Date();
        module.viewState = 'LIST';
        workOrderCommand.execute(designToDo_ui);
      }
    }));
    module.contents.push(new tgi.Command({
      name: 'Prev Day',
      theme: 'default',
      icon: 'fa-arrow-left',
      type: 'Function',
      contents: function () {
        module.InvoiceNumber.value = '';
        module.ServiceDate.value = moment(module.ServiceDate.value).subtract(1, 'days').toDate();
        module.viewState = 'LIST';
        workOrderCommand.execute(designToDo_ui);
      }
    }));
    module.contents.push(new tgi.Command({
      name: 'Date',
      theme: 'default',
      icon: 'fa-calendar',
      type: 'Function',
      contents: function () {
        module.InvoiceNumber.value = '';
        module.viewState = 'DATESEARCH';
        workOrderCommand.execute(designToDo_ui);
      }
    }));
    module.contents.push(new tgi.Command({
      name: 'Next Day',
      theme: 'default',
      icon: 'fa-arrow-right',
      type: 'Function',
      contents: function () {
        module.InvoiceNumber.value = '';
        module.ServiceDate.value = moment(module.ServiceDate.value).add(1, 'days').toDate();
        module.viewState = 'LIST';
        workOrderCommand.execute(designToDo_ui);
      }
    }));
    module.contents.push(new tgi.Command({
      name: 'Invoice #',
      theme: 'default',
      icon: 'fa-search',
      type: 'Function',
      contents: function () {
        module.viewState = 'INVOICESEARCH';
        workOrderCommand.execute(designToDo_ui);
      }
    }));
    module.contents.push(new tgi.Command({
      name: 'Print',
      theme: 'default',
      icon: 'fa-print',
      type: 'Function',
      contents: function () {
        printOrders();
      }
    }));

    if (module.ServiceDate.value) {
      var weekday = new Array(7);
      weekday[0] = "Sunday";
      weekday[1] = "Monday";
      weekday[2] = "Tuesday";
      weekday[3] = "Wednesday";
      weekday[4] = "Thursday";
      weekday[5] = "Friday";
      weekday[6] = "Saturday";
      var dow = weekday[module.ServiceDate.value.getDay()];
      reportDate = dow + ' ' + tgi.left(module.ServiceDate.value.toISOString(), 10);
      module.contents.push('#### ' + reportDate);
    }

    /**
     * Fetch each order with no invoice
     */
    var daList = new tgi.List(new site.Invoice());
    var crit = {ServiceDate: null, InvoiceNumber: ''};
    if (module.ServiceDate.value) {
      var critDate = module.ServiceDate.value;
      critDate.setHours(0, 0, 0, 0);
      crit = {ServiceDate: critDate};
    }

    if (module.InvoiceNumber.value) {
      crit = {InvoiceNumber: module.InvoiceNumber.value};
    }

    site.hostStore.getList(daList, crit, {ServiceDate: 1, id: 1}, function (invoiceList, error) {
      if (error) {
        console.log('error loading invoice: ' + error);
      } else {
        if (invoiceList.moveFirst()) {
          function populateRow() {
            /**
             * Make sure ready to schedule
             */
            var UtilityReference = invoiceList.get('UtilityReference') || '';

            /**
             * Get tech names
             */
            var tech1, tech2;
            var primaryTechID = invoiceList.get('PrimaryTechID');
            var secondaryTechID = invoiceList.get('SecondaryTechID');
            for (var i = 0; i < site.techID.length; i++) {
              var techID = site.techID[i];
              if (techID) {
                if (techID === primaryTechID) tech1 = site.techList[i];
                if (techID === secondaryTechID) tech2 = site.techList[i];
              }
            }
            var techs = (tech1 || ''); //  + (tech2 ? ('/' + tech2) : '');
            /**
             * Get customer
             */
            var customer = new site.Customer();
            customer.set('id', invoiceList.get('CustomerID'));
            site.hostStore.getModel(customer, function (model, error) {
              customer = model;
              listView.addItem(new LocateOrder());
              listView.set('id', invoiceList.get('id'));
              listView.set('CustomerID', invoiceList.get('CustomerID'));
              var icon = invoiceList.get('Emergency') ? '<i class="fa fa-support"></i> ' : '<i class="fa fa-calendar-check-o"></i> ';
              var rawDate = invoiceList.get('ServiceDate');
              var theDate = rawDate ? tgi.left(rawDate.toISOString(), 10) : '(not set)'; // ;
              var CustomerIssues = invoiceList.get('CustomerIssues') || '';
              var invoiceNumber = invoiceList.get('invoiceNumber') || '';
              var invoiceAmount = invoiceList.get('invoiceAmount') || '0';
              var Phone = '';
              var phoneSpace = '';

              var addressFrom = customer;
              if (customer.get('CompanyGroup'))
                addressFrom = invoiceList;

              if (customer.get('HomePhone')) {
                Phone += (phoneSpace + '<i class="fa fa-home"></i> ' + customer.get('HomePhone'));
                phoneSpace = ' ';
              }
              if (customer.get('WorkPhone')) {
                Phone += (phoneSpace + '<i class="fa fa-building-o"></i> ' + customer.get('WorkPhone'));
                phoneSpace = ' ';
              }
              if (customer.get('CellPhone')) {
                Phone += (phoneSpace + '<i class="fa fa-mobile"></i> ' + customer.get('CellPhone'));
                phoneSpace = ' ';
              }
              if (customer.get('CompanyGroup') && invoiceList.get('ContactPhone')) {
                Phone += (phoneSpace + '<strong>' + invoiceList.get('Contact') + '</strong> ' + invoiceList.get('ContactPhone'));
                phoneSpace = ' ';
              }

              listView.set('Phone', Phone);
              listView.set('Date', icon + theDate);
              var TechNotes = invoiceList.get('Comments') || '';
              if (TechNotes.length)
                CustomerIssues += '</br><i>Tech Notes: ' + TechNotes + '</i>';


              if (invoiceNumber.length === 0)
                listView.set('CustomerIssues', icon + CustomerIssues);
              else if (invoiceNumber === '*' && Number(invoiceAmount) === 0)
                listView.set('CustomerIssues', '<b>CANCELLED</b></br> ' + CustomerIssues);
              else
                listView.set('CustomerIssues', '<b>Inv #' + invoiceNumber + ' $' + invoiceAmount + '</b></br> ' + CustomerIssues);
              listView.set('ServiceDate', invoiceList.get('ServiceDate'));
              if (techs) {
                if (invoiceNumber.length === 0)
                  techs = '<i class="fa fa-square-o"> ' + techs;
                else if (invoiceNumber === '*')
                  techs = '<i class="fa fa-check-square-o"> ' + techs;
                else
                  techs = '<i class="fa fa-file-text-o"> ' + techs;
                listView.set('techs', techs);
              }

              if (error) {
                app.err('getModel error: ' + error);
              } else {
                var cust = customer.get('Customer');
                if (customer.get('CompanyGroup')) {
                  cust = cust + ' / <i class="fa fa-address-book"></i> ' + invoiceList.get('Contact');
                }
                else if (customer.get('Contact')) {
                  cust = cust + ' / ' + customer.get('Contact');
                }
                listView.set('Customer', cust);
                listView.set('Address', addressFrom.get('Address1') + '<br><strong>' + addressFrom.get('City') + '</strong>');
              }
              /**
               * Add to reportData
               */
              if (!(invoiceNumber === '*' && Number(invoiceAmount) === 0)) {
                var techName = tech1 || '(Unassigned)';
                var currTechRecordNo = -1;
                for (var techNo = 0; techNo < reportData.length && currTechRecordNo < 0; techNo++) {
                  if (reportData[techNo].name === techName)
                    currTechRecordNo = techNo;
                }
                if (currTechRecordNo < 0) {
                  currTechRecordNo = reportData.length;
                  reportData.push({
                    name: techName,
                    orders: []
                  });
                }

                var fullAddress = addressFrom.get('Address1') + '<br>';
                if (addressFrom.get('Address2'))
                  fullAddress += addressFrom.get('Address2') + '<br>';
                fullAddress += addressFrom.get('City');
                if (addressFrom.get('State'))
                  fullAddress += ', ' + addressFrom.get('State');
                if (addressFrom.get('Zip'))
                  fullAddress += ' ' + addressFrom.get('Zip');

                var phones = '';
                if (customer.get('HomePhone'))
                  phones += '<strong>H: </strong>' + customer.get('HomePhone') + '<br>';
                if (customer.get('WorkPhone'))
                  phones += '<strong>W: </strong>' + customer.get('WorkPhone') + '<br>';
                if (customer.get('CellPhone'))
                  phones += '<strong>C: </strong>' + customer.get('CellPhone') + '<br>';
                if (customer.get('CompanyGroup') && invoiceList.get('ContactPhone')) {
                  phones += '<i class="fa fa-address-book"></i> ' + invoiceList.get('ContactPhone') + '<br>';
                }

                reportData[currTechRecordNo].orders.push({
                  name: cust,
                  city: addressFrom.get('City'),
                  address: fullAddress,
                  phones: phones,
                  notes: CustomerIssues
                });
              }
              nextRow();
            });
          }

          populateRow();

          function nextRow() {
            if (invoiceList.moveNext()) {
              setTimeout(function () {
                populateRow();
              }, 0);
            } else {
              if (listView.moveFirst())
                module.contents.push(listView);
              else if (module.ServiceDate.value)
                module.contents.push('No work orders to show for ' + tgi.left(module.ServiceDate.value.toISOString(), 10));
              else
                module.contents.push('No work orders to show.');
              callbackDone();
            }
          }
        } else {
          if (module.ServiceDate.value)
            module.contents.push('No work orders to show for ' + tgi.left(module.ServiceDate.value.toISOString(), 10));
          else
            module.contents.push('No work orders to show.');
          callbackDone();
        }
      }
    });

    /**
     * When user selects from list
     */
    listView.pickKludge = function (id) {
      module.orderID = null;
      var hasMore = listView.moveFirst();
      while (hasMore && !module.orderID) {
        if (listView.get('id') == id)
          module.orderID = id;
        else
          listView.moveNext();
      }
      if (module.orderID) {
        var choices = [];
        var choice1 = choices[choices.push('Assign primary tech') - 1];
        var choice2 = choices[choices.push('Load CUSTOMER') - 1];
        var choice2b = choices[choices.push('Load ORDER') - 1];
        var choice3 = choices[choices.push('Open address in Bing maps') - 1];
        var choice4 = choices[choices.push('Mark as done (or unmark)') - 1];
        app.choose('What would you like to do?', choices, function (choice) {
          switch (choice) {
            case choice1:
              app.choose('Assign primary tech', site.techList, function (choice) {
                if (choice !== undefined)
                  setPrimaryTech(choice)
              });
              break;
            case choice2:
              site.customerMaintenance.modelID = listView.get('CustomerID');
              site.customerMaintenance.internalRefresh = true;
              site.customerMaintenance.viewState = 'VIEW';
              site.customerCommand.execute(designToDo_ui);
              break;
            case choice2b:
              site.customerInvoiceIsNew = false;
              site.customerInvoice = new site.Invoice();
              site.customerInvoice.set('id', id);
              site.hostStore.getModel(site.customerInvoice, function (model, error) {
                site.customerInvoice = model;
                if (error) {
                  app.err('getModel error: ' + error);
                } else {
                  site.customerMaintenance.viewState = 'CUSTOM';
                  site.customerCommand.execute(designToDo_ui);
                }
              });
              break;
            case choice3:
              site.Customer.Map(listView.get('CustomerID'));
              break;
            case choice4:
              markAsDone();
              break;
            default:
          }
        });
      } else {
        app.err('error locating order');
      }
    };

    /**
     * Mark as done
     */
    function markAsDone() {

      /**
       * Get invoice
       */
      var invoice = new site.Invoice();
      invoice.set('id', module.orderID);
      site.hostStore.getModel(invoice, function (model, error) {
        if (error) {
          app.err('invoice  getModel error: ' + error);
          return;
        }
        var invoiceNumber = invoice.get('invoiceNumber') || '';
        var q = 'Mark job done?';
        var v = '*';
        if (invoiceNumber.length) {
          q = 'Mark job NOT DONE?';
          v = '';
          if (invoiceNumber != '*') {
            app.info('Job already invoiced!');
            return;
          }
        }

        app.yesno(q, function (response) {
          if (!response)
            return;
          invoice.set('invoiceNumber', v);
          site.hostStore.putModel(invoice, function (model, error) {
            if (error) {
              app.err('Error saving invoice: ' + error);
            } else {
              module.command.execute(designToDo_ui);
            }
          });

        })
      });
    }

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
      invoice.set('id', module.orderID);
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
            module.command.execute(designToDo_ui);
          }
        });
      });
    }

    /**
     * Print Orders
     */
    function printOrders() {
      var data = '';
      data += '<!DOCTYPE html>';
      data += '<html lang="en">';

      data += '<head>';
      data += '<meta charset="UTF-8">';
      data += '<title>Bowen Septic Schedule</title>';
      data += '<link rel="stylesheet" href="lib/desktop/bootstrap/css/bootstrap.css">';
      data += '<link rel="stylesheet" href="lib/desktop/font-awesome/css/font-awesome.css">';
      data += '</head>';

      data += '<body>';
      data += '<div class="container">';

      for (var i = 0; i < reportData.length; i++) {
        var techRecord = reportData[i];
        data += '<h2 style="page-break-before:always;">Bowen Septic Work Orders</h2>';
        data += '<h1>' + reportDate + ' -- ' + techRecord.name + '</h1>';

        for (var j = 0; j < techRecord.orders.length; j++) {
          var order = techRecord.orders[j];
          data += '<div class="table">';
          data += '<table style="font-size: larger" class="table">';
          data += '<thead>';
          data += '<tr>';
          data += '<th width="75%">' + order.name + '</th>';
          data += '<th width="25%">' + order.city + '</th>';
          data += '</tr>';
          data += '</thead>';
          data += '<tbody>';
          data += '<tr>';
          data += '<td width="75%">';
          data += order.address;
          data += '<br>';
          data += order.notes;
          data += '</td>';
          data += '<td width="25%">';
          data += order.phones;
          data += '</td>';
          data += '</tr>';
          data += '</tbody>';
          data += '</table>';
          data += '</div>';
          data += '<hr>';
        }
      }
      data += '</div>';
      data += '</body>';
      data += '</html>';
      data += '<script>';
      data += 'setTimeout(function () {';
      data += 'window.print();';
      data += 'window.close();';
      data += '},250);';
      data += '</script>';

      var new_page = window.open();
      new_page.document.write(data);
    }
  }

  /**
   * force
   // */
  // setTimeout(function () {
  //   workOrderCommand.execute(ui);
  // }, 100);
}());