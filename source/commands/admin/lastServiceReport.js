/**---------------------------------------------------------------------------------------------------------------------
 * field-service/xxx/lastServiceReport
 */
var designToDo_ui = ui;

(function () {
  var module = {};
  module.freshView = true;
  module.viewState = 'CRITERIA';
  module.dateFrom = new tgi.Attribute({name: 'dateFrom', label: 'From', type: 'Date'});
  module.dateTo = new tgi.Attribute({name: 'dateTo', label: 'To', type: 'Date'});
  module.customersPerPage = new tgi.Attribute({name: 'customersPerPage', label: 'Customers Per Page', type: 'Number'});
  module.dateFrom.value = new Date();
  module.dateTo.value = new Date();
  module.customersPerPage.value = 10;
  var lastServiceReportPresentation = new tgi.Presentation();
  lastServiceReportPresentation.preRenderCallback = function (command, callback) {
    if (module.freshView) {
      module.viewState = 'CRITERIA';
    }
    module.freshView = true;
    module.presentation = command.contents;
    module.callback = callback;
    module.command = command;
    module.contents = [];
    switch (module.viewState) {
      case 'CRITERIA':
        try {
          renderCriteria();
        } catch (e) {
          app.err('renderCriteria(' + e + ')')
        }
        break;
      case 'CALCULATE':
        try {
          renderCalculation();
        } catch (e) {
          app.err('renderCriteria(' + e + ')')
        }
        break;
      case 'PRINTED':
        try {
          renderPrinted(true);
        } catch (e) {
          app.err('renderCriteria(' + e + ')')
        }
        break;
      case 'FAILED':
        try {
          renderPrinted(false);
        } catch (e) {
          app.err('renderCriteria(' + e + ')')
        }
        break;
      default:
        module.contents.push('UNKNOWN VIEW STATE ' + module.viewState);
        callbackDone();
        break;
    }
  };
  var lastServiceReportCommand = new tgi.Command({
    name: 'Last Service Report',
    theme: 'danger',
    type: 'Presentation',
    icon: 'fa-file-text-o',
    contents: lastServiceReportPresentation
  });
  lastServiceReportCommand.presentationMode = 'Edit';
  site.adminMenu.push(lastServiceReportCommand);

  /**
   * Callback after async ops done
   */
  function callbackDone() {
    module.presentation.set('contents', module.contents);
    module.callback(module.command);
  }

  /**
   * Render Criteria
   */
  function renderCriteria() {
    module.contents.push('Enter last service date range for report.');
    module.contents.push('-');
    module.contents.push(module.dateFrom);
    module.contents.push(module.dateTo);
    module.contents.push(module.customersPerPage);
    module.contents.push('-');
    module.contents.push('>');
    module.contents.push(new tgi.Command({
      name: 'Prepare Report',
      theme: 'default',
      icon: 'fa-print',
      type: 'Function',
      contents: function () {
        module.viewState = 'CALCULATE';
        module.freshView = false;
        lastServiceReportCommand.execute(designToDo_ui);
      }
    }));
    callbackDone();
  }

  /**
   * Render Calculation
   */
  function renderCalculation() {
    module.contents.push('</br><b>PREPARING FILE PLEASE WAIT...</b></br>');
    callbackDone();
    module.csvData = [];
    module.customerHash = {};
    module.customerHashIgnore = {};
    /**
     * Get all customers
     */
    var customers = new tgi.List(new site.Customer());
    site.hostStore.getList(customers, {}, {}, function (customerList, error) {
      if (error) {
        app.err('Customer getList error: ' + error);
        return;
      }

      /**
       * Now get all orders
       */
      var orders = new tgi.List(new site.Invoice());
      site.hostStore.getList(orders, {}, {}, function (orderList, error) {
        if (error) {
          app.err('Invoice getList error: ' + error);
          return;
        }
        var gotMore = orderList.moveFirst();
        while (gotMore) {
          var ServiceDate = orderList.get('ServiceDate');
          if (ServiceDate) {
            ServiceDate = moment(ServiceDate).toDate();
            var dateFrom = moment(module.dateFrom.value).toDate();
            var dateTo = moment(module.dateTo.value).add(1, 'days').toDate();
            dateFrom.setHours(0, 0, 0, 0);
            dateTo.setHours(0, 0, 0, 0);
            var CustomerID = orderList.get('CustomerID');
            if (ServiceDate >= dateFrom && ServiceDate >= dateTo) {
              module.customerHashIgnore[CustomerID] = true;
            }
            if (ServiceDate >= dateFrom && ServiceDate <= dateTo) {
              if (!module.customerHash[CustomerID])
                module.customerHash[CustomerID] = [];
              module.customerHash[CustomerID].push({
                ServiceDate: orderList.get('ServiceDate'),
                TankPumped: orderList.get('TankPumped'),
                TankPumped1500: orderList.get('TankPumped1500'),
                CustomerIssues: orderList.get('CustomerIssues'),
                Comments: orderList.get('Comments'),
              });
            }
          }
          gotMore = orderList.moveNext();
        }

        // console.log(module.customerHash);
        /**
         * Done...
         */
        dateFrom = tgi.left('' + moment(module.dateFrom.value).toDate(), 15);
        dateTo = tgi.left('' + moment(module.dateTo.value).add(1, 'days').toDate(), 15);
        // module.fname = 'Bowen Service ' + dateFrom + ' to ' + dateTo + '.csv';
        printReport(customers);

      });
    });
  }

  function printReport(customer) {
    let data = '';
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

    reportDetails();

    data += '</div>';
    data += '</body>';
    data += '</html>';
    data += '<script>';
    data += 'setTimeout(function () {';
    data += 'window.print();';
    data += 'window.close();';
    data += '},250);';
    data += '</script>';
    console.log('printReport()');
    var new_page = window.open();
    if (new_page) {
      new_page.document.write(data);
      module.viewState = 'PRINTED';
    } else {
      module.viewState = 'FAILED';
    }
    module.freshView = false;
    lastServiceReportCommand.execute(designToDo_ui);


    function reportDetails() {
      let dateRange = ' ' + tgi.left(module.dateFrom.value.toISOString(), 10) + ' - ' + tgi.left(module.dateTo.value.toISOString(), 10);
      let header2 = '<h2>Last Service Report' + dateRange + '</h2>';
      let pageHeadCountDown = 0;
      customer.sort({Customer: 1});
      let gotMore = customer.moveFirst();
      while (gotMore) {
        let CustomerID = customer.get('id');
        if (module.customerHash[CustomerID] && !module.customerHashIgnore[CustomerID]) {
          if (pageHeadCountDown <= 0) {
            data += header2;
            header2 = '<h2 style="page-break-before:always;">Last Service Report' + dateRange + '</h2>';
            pageHeadCountDown = module.customersPerPage.value;
          }
          let name = customer.get('Customer') || '(blank)';
          let city = customer.get('city') || '(unknown)'
          let address = customer.get('address1') || '(unknown)'
          let orders = module.customerHash[customer.get('id')];
          let notes = '';

          if (orders) {
            for (let order of orders) {
              // console.log(order);
              notes += '<strong> ' + tgi.left(order.ServiceDate.toISOString(), 10) + '</strong>';
              if (order.Comments)
                notes += (' Tech Notes: ' + order.Comments);
              else
                notes += (' Customer Issues: ' + order.CustomerIssues);
            }
          }
          let phones = '';
          if (customer.get('HomePhone'))
            phones += '<strong>H: </strong>' + customer.get('HomePhone') + '<br>';
          if (customer.get('WorkPhone'))
            phones += '<strong>W: </strong>' + customer.get('WorkPhone') + '<br>';
          if (customer.get('CellPhone'))
            phones += '<strong>C: </strong>' + customer.get('CellPhone') + '<br>';

          data += '<div class="table">';
          data += '<table style="font-size: larger" class="table">';
          data += '<tbody>';
          data += '<tr>';
          data += '<td width="75%">';
          data += '<strong>' + name + '</strong>';
          data += '<br>';
          data += '<strong>' + address + ', ' + city + '</strong>';
          data += '<br>';
          data += notes;
          data += '</td>';
          data += '<td width="25%">';
          data += phones;
          data += '</td>';
          data += '</tr>';
          data += '</tbody>';
          data += '</table>';
          data += '</div>';
          pageHeadCountDown--;
        }
        gotMore = customer.moveNext();
      }
    }
  }

  function renderPrinted(success) {
    // module.contents.push('</br><b>File exported: ' + module.fname + '</b></br>');
    if (success)
      module.contents.push('</br><b>Report Printed</b></br>');
    else
      module.contents.push('</br><b>Report Failed to print make sure popups are enabled for this site.</b></br>');
    callbackDone();
  }

  /**
   * force
   */
  // setTimeout(function () {
  //   lastServiceReportCommand.execute(ui);
  // }, 100);
}());