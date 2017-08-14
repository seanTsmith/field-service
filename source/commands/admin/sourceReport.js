/**---------------------------------------------------------------------------------------------------------------------
 * field-service/source/commands/admin/sourceReport.js
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
  var sourceReportPresentation = new tgi.Presentation();
  sourceReportPresentation.preRenderCallback = function (command, callback) {
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
      case 'REPORT':
        try {
          renderReport();
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
  var sourceReportCommand = new tgi.Command({
    name: 'Source Report',
    theme: 'danger',
    type: 'Presentation',
    icon: 'fa-file-text-o',
    contents: sourceReportPresentation
  });
  sourceReportCommand.presentationMode = 'Edit';
  site.adminMenu.push(sourceReportCommand);

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
    module.contents.push('Enter date range for source report.');
    module.contents.push('-');
    module.contents.push(module.dateFrom);
    module.contents.push(module.dateTo);
    module.contents.push('-');
    module.contents.push('>');
    module.contents.push(new tgi.Command({
      name: 'Calculate Report',
      theme: 'default',
      icon: 'fa-list',
      type: 'Function',
      contents: function () {
        module.viewState = 'CALCULATE';
        module.freshView = false;
        sourceReportCommand.execute(designToDo_ui);

      }
    }));
    callbackDone();
  }

  /**
   * Render Calculation
   */
  function renderCalculation() {
    module.contents.push('</br><b>CALCULATING PLEASE WAIT...</b></br>');
    callbackDone();

    module.sources = {};
    module.orderCount = 0;

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
       * Build customer source object
       */
      var customerSource = {};
      var gotMore = customerList.moveFirst();
      while (gotMore) {
        var src = customerList.get('Source') || '(Unknown)';
        if (src.indexOf('Referral:')>=0)
          src = 'Referral';
        var id = customerList.get('id');
        if (id)
          customerSource[id] = src;
        gotMore = customerList.moveNext();
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
              module.orderCount++;

              console.log('dateFrom ' + dateFrom);
              console.log('ServiceDate ' + ServiceDate);
              console.log('dateTo ' + dateTo);
              var CustomerID = orderList.get('CustomerID');
              var Source = customerSource[CustomerID];

              if (!(Source in module.sources)) {
                module.sources[Source] = 0;
              }
              module.sources[Source]++;

              console.log('Source: ' + Source + ' count ' + module.sources[Source]);
            }

          }
          gotMore = orderList.moveNext();
        }
        module.viewState = 'REPORT';
        module.freshView = false;
        sourceReportCommand.execute(designToDo_ui);
      });

    });

  }

  /**
   * Model for list view
   */
  var ReportDetails = function (args) {
    if (false === (this instanceof ReportDetails)) throw new Error('new operator required');
    args = args || {};
    if (!args.attributes) {
      args.attributes = [];
    }
    args.attributes.push(new tgi.Attribute({name: 'Source', type: 'String'}));
    args.attributes.push(new tgi.Attribute({name: 'Count', type: 'Number'}));
    tgi.Model.call(this, args);
    this.modelType = "ReportDetails";
  };
  ReportDetails.prototype = Object.create(tgi.Model.prototype);

  /**
   * Render Report
   */
  function renderReport() {

    var list = '';
    var details = new ReportDetails();
    var listView = new tgi.List(details);

    for (var source in module.sources) {
      listView.addItem(new ReportDetails());
      listView.set('Source', source);
      listView.set('Count', module.sources[source]);
    }
    listView.sort({Count:-1});
    module.contents.push('#### ' + tgi.left(module.dateFrom.value.toISOString(), 10) + ' to ' + tgi.left(module.dateTo.value.toISOString(), 10) +
      ' -- Total ' + module.orderCount + ' orders');
    module.contents.push(listView);
    // module.contents.push(list);
    callbackDone();

  }

  /**
   * force
   */
  // setTimeout(function () {
  //   sourceReportCommand.execute(ui);
  // }, 0);
}());