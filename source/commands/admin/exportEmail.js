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
  module.dateFrom.value = new Date('6/1/2017');
  module.dateTo.value = new Date('7/31/2017');
  var exportEmailPresentation = new tgi.Presentation();
  exportEmailPresentation.preRenderCallback = function (command, callback) {
    console.log('module.freshView ' + module.freshView);
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
    var emailTemplate = {
      FirstName: '',
      LastName: '',
      Email: ''
    };

    module.csvData.push({
      FirstName: 'Sean',
      LastName: 'Smith',
      Email: 'sean@smith.com'
    });

    module.csvData.push({
      FirstName: 'John',
      LastName: 'Doe',
      Email: 'J@D.com'
    });

    downloadCSV({ filename: "test.csv" });
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

    data.forEach(function(item) {
      ctr = 0;
      keys.forEach(function(key) {
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
  setTimeout(function () {
    exportEmailCommand.execute(ui);
  }, 0);
}());