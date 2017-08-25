/**---------------------------------------------------------------------------------------------------------------------
 * field-service/source/commands/admin/exportCustomers.js
 */
var designToDo_ui = ui;

(function () {
  var module = {};
  module.freshView = true;
  module.viewState = 'CRITERIA';
  module.exportOrders = new tgi.Attribute({label: 'Export all Orders', name: 'exportOrders', type: 'Boolean'});
  module.exportCustomers = new tgi.Attribute({label: 'Export latest Order', name: 'exportCustomers', type: 'Boolean'});
  var exportCustomersPresentation = new tgi.Presentation();
  exportCustomersPresentation.preRenderCallback = function (command, callback) {
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
  var exportCustomersCommand = new tgi.Command({
    name: 'Export Customers',
    theme: 'danger',
    type: 'Presentation',
    icon: 'fa-file-text-o',
    contents: exportCustomersPresentation
  });
  exportCustomersCommand.presentationMode = 'Edit';
  site.adminMenu.push(exportCustomersCommand);

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
    module.contents.push('All customers will be exported to a CSV file with each order.');
    module.contents.push('-');
    module.contents.push('>');
    module.contents.push(new tgi.Command({
      name: 'Create Customer Export File',
      theme: 'default',
      icon: 'fa-save',
      type: 'Function',
      contents: function () {
        module.viewState = 'CALCULATE';
        module.freshView = false;
        exportCustomersCommand.execute(designToDo_ui);
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
          gotMore = orderList.moveNext();
        }

        /**
         * Create CSV struct from customers
         */
        var gotMore = customerList.moveFirst();
        var count = 0;
        while (count++ >=0 && gotMore) {
          var customerFields =
            [
              'Customer',
              'Address1',
              'Address2',
              'City',
              'State',
              'Zip',
              'County',
              'CrossStreet',
              'Contact',
              'HomePhone',
              'WorkPhone',
              'CellPhone',
              'Email',
              'Source',
              'Comments',
              'CompanyGroup'
            ];
          var pushMe={};
          for (var i = 0; i < customerFields.length; i++) {
            var fld = customerFields[i];
            pushMe[fld] = customerList.get(fld);

          }
          module.csvData.push(pushMe);
          gotMore = customerList.moveNext();
        }
        console.log('count is ' + count);

        /**
         * Done...
         */

        module.fname = 'Bowen Septic Customers and Orders.csv';

        downloadCSV({filename: module.fname});

        module.viewState = 'EXPORTED';
        module.freshView = false;
        exportCustomersCommand.execute(designToDo_ui);
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
    console.log('data is '+ data.length);

    link = document.createElement('a');
    link.setAttribute('href', data);
    link.setAttribute('download', filename);
    link.click();
  }

  /**
   * force
   */
  setTimeout(function () {
    exportCustomersCommand.execute(ui);
  }, 0);
}());