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
            if (ServiceDate >= dateFrom && ServiceDate < dateTo) {
              var CustomerID = orderList.get('CustomerID');
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

        console.log(module.customerHash);

        /**
         * Create CSV struct from customers
         */
        // var gotMore = customerList.moveFirst();
        // console.log('BOOH');
        // while (gotMore) {
        //   var name = customerList.get('Customer') || '';
        //   if (module.customerHash[customerList.get('id')]) {
        //     console.log('Customer: ' + name);
        //     var space = name.indexOf(" ");
        //     var firstName = name;
        //     var lastName = '';
        //     if (space > 0) {
        //       firstName = tgi.left(name, space);
        //       lastName = tgi.right(name, name.length - space);
        //     }
        //     // console.log('firstName ' + firstName + '.');
        //     // console.log('lastName ' + lastName + '.');
        //     module.csvData.push({
        //       name: name,
        //     });
        //   }
        //   gotMore = customerList.moveNext();
        // }


        /**
         * Done...
         */

        dateFrom = tgi.left('' + moment(module.dateFrom.value).toDate(), 15);
        dateTo = tgi.left('' + moment(module.dateTo.value).add(1, 'days').toDate(), 15);
        // module.fname = 'Bowen Service ' + dateFrom + ' to ' + dateTo + '.csv';

        // downloadCSV({filename: module.fname});

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

        if (module.customerHash[customer.get('id')]) {

          if (pageHeadCountDown <= 0) {
            data += header2;
            header2 = '<h2 style="page-break-before:always;">Last Service Report' + dateRange + '</h2>';
            pageHeadCountDown = module.customersPerPage.value;
          }

          // let name = customer.get('Customer') || '';
          // data += (name + '</BR>');

          let name = customer.get('Customer') || '(blank)';
          let city = customer.get('city') || '(unknown)'
          let address = customer.get('address1') || '(unknown)'
          let orders = module.customerHash[customer.get('id')];
          let notes = '';

          if (orders) {
            for (let order of orders) {
              // console.log(order);

              notes += '<strong> '+tgi.left(order.ServiceDate.toISOString(), 10)+'</strong>';
              if (order.Comments)
                notes += (' Tech Notes: ' + order.Comments);
              else
                notes += (' Customer Issues: ' + order.CustomerIssues);


            }

            // notes = '' + tgi.left(orders[0].ServiceDate.toISOString(), 10);
            // if (orders[0].Comments)
            //   notes += (' Tech Notes: ' + orders[0].Comments);
            // else
            //   notes += (' Customer Issues: ' + orders[0].CustomerIssues);
            // module.customerHash[CustomerID].push({
            //   ServiceDate: orderList.get('ServiceDate'),
            //   TankPumped: orderList.get('TankPumped'),
            //   TankPumped1500: orderList.get('TankPumped1500'),
            //   CustomerIssues: orderList.get('CustomerIssues'),
            //   Comments: orderList.get('Comments'),
            // });

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
          // data += '<thead>';
          // data += '<tr>';
          // data += '<th width="75%">' + name + '</th>';
          // data += '<th width="25%">' + city + '</th>';
          // data += '</tr>';
          // data += '</thead>';
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
          // data += '<hr>';

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
   * Export Helpers
   */
  // function convertArrayOfObjectsToCSV(args) {
  //   var result, ctr, keys, columnDelimiter, lineDelimiter, data;
  //
  //   data = args.data || null;
  //   if (data == null || !data.length) {
  //     return null;
  //   }
  //
  //   columnDelimiter = args.columnDelimiter || ',';
  //   lineDelimiter = args.lineDelimiter || '\n';
  //
  //   keys = Object.keys(data[0]);
  //
  //   result = '';
  //   result += keys.join(columnDelimiter);
  //   result += lineDelimiter;
  //
  //   data.forEach(function (item) {
  //     ctr = 0;
  //     keys.forEach(function (key) {
  //       if (ctr > 0) result += columnDelimiter;
  //
  //       result += item[key];
  //       ctr++;
  //     });
  //     result += lineDelimiter;
  //   });
  //
  //   return result;
  // }

  // function downloadCSV(args) {
  //   var data, filename, link;
  //
  //   var csv = convertArrayOfObjectsToCSV({
  //     data: module.csvData
  //   });
  //   if (csv == null) return;
  //
  //   filename = args.filename || 'export.csv';
  //
  //   if (!csv.match(/^data:text\/csv/i)) {
  //     csv = 'data:text/csv;charset=utf-8,' + csv;
  //   }
  //   data = encodeURI(csv);
  //
  //   link = document.createElement('a');
  //   link.setAttribute('href', data);
  //   link.setAttribute('download', filename);
  //   link.click();
  // }

  /**
   * force
   */
  // setTimeout(function () {
  //   lastServiceReportCommand.execute(ui);
  // }, 100);
}());