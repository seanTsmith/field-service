/**---------------------------------------------------------------------------------------------------------------------
 * field-service/source/commands/admin/exportEmail.js
 */
var designToDo_ui = ui;

(function () {
  var module = {};
  module.freshView = true;
  module.viewState = 'CRITERIA';
  module.dateFrom = new tgi.Attribute({name: 'dateFrom', label: 'From', type: 'Date'});
  module.dateTo = new tgi.Attribute({name: 'dateTo', label: 'To', type: 'Date'});
  module.dateFrom.value = new Date();
  module.dateTo.value = new Date();
  var exportEmailPresentation = new tgi.Presentation();
  exportEmailPresentation.preRenderCallback = function (command, callback) {
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
      case 'EXPORTED':
        try {
          renderExported();
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
  var exportEmailCommand = new tgi.Command({
    name: 'Export Emails',
    theme: 'danger',
    type: 'Presentation',
    icon: 'fa-file-text-o',
    contents: exportEmailPresentation
  });
  exportEmailCommand.presentationMode = 'Edit';
  site.adminMenu.push(exportEmailCommand);

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
    module.contents.push('Enter last service date range for mailing list export');
    module.contents.push('-');
    module.contents.push(module.dateFrom);
    module.contents.push(module.dateTo);
    module.contents.push('-');
    module.contents.push('>');
    module.contents.push(new tgi.Command({
      name: 'Create Export File',
      theme: 'default',
      icon: 'fa-save',
      type: 'Function',
      contents: function () {
        module.viewState = 'CALCULATE';
        module.freshView = false;
        exportEmailCommand.execute(designToDo_ui);
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
              module.customerHash[CustomerID] = true;
            }
          }
          gotMore = orderList.moveNext();
        }
        /**
         * Create CSV struct from customers
         */
        var gotMore = customerList.moveFirst();
        while (gotMore) {
          var name = customerList.get('Customer') || '';
          var email = customerList.get('Email') || '';
          if (email && email.includes("@") && module.customerHash[customerList.get('id')]) {
            console.log('Customer: ' + name + ' email: ' + email);
            var space = name.indexOf(" ");
            var firstName = name;
            var lastName = '';
            if (space > 0) {
              firstName = tgi.left(name, space);
              lastName = tgi.right(name, name.length - space);
            }
            console.log('firstName ' + firstName + '.');
            console.log('lastName ' + lastName + '.');
            module.csvData.push({
              FirstName: firstName,
              LastName: lastName,
              Email: email
            });
          }
          gotMore = customerList.moveNext();
        }


        /**
         * Done...
         */

        dateFrom = tgi.left('' + moment(module.dateFrom.value).toDate(), 15);
        dateTo = tgi.left('' + moment(module.dateTo.value).add(1, 'days').toDate(), 15);
        module.fname = 'Bowen Service ' + dateFrom + ' to ' + dateTo + '.csv';

        downloadCSV({filename: module.fname});

        module.viewState = 'EXPORTED';
        module.freshView = false;
        exportEmailCommand.execute(designToDo_ui);
      });
    });
  }

  function renderExported() {
    module.contents.push('</br><b>File exported: ' + module.fname + '</b></br>');
    callbackDone();
  }


  /**
   * Export Helpers
   */
  function convertArrayOfObjectsToCSV(args) {
    var result, ctr, keys, columnDelimiter, lineDelimiter, data;

    data = args.data || null;
    if (data == null || !data.length) {
      return null;
    }

    columnDelimiter = args.columnDelimiter || ',';
    lineDelimiter = args.lineDelimiter || '\n';

    keys = Object.keys(data[0]);

    result = '';
    result += keys.join(columnDelimiter);
    result += lineDelimiter;

    data.forEach(function (item) {
      ctr = 0;
      keys.forEach(function (key) {
        if (ctr > 0) result += columnDelimiter;

        result += item[key];
        ctr++;
      });
      result += lineDelimiter;
    });

    return result;
  }

  function downloadCSV(args) {
    var data, filename, link;

    var csv = convertArrayOfObjectsToCSV({
      data: module.csvData
    });
    if (csv == null) return;

    filename = args.filename || 'export.csv';

    if (!csv.match(/^data:text\/csv/i)) {
      csv = 'data:text/csv;charset=utf-8,' + csv;
    }
    data = encodeURI(csv);

    link = document.createElement('a');
    link.setAttribute('href', data);
    link.setAttribute('download', filename);
    link.click();
  }

  /**
   * force
   */
  // setTimeout(function () {
  //   exportEmailCommand.execute(ui);
  // }, 0);
}());