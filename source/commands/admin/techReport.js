/**---------------------------------------------------------------------------------------------------------------------
 * field-service/source/commands/admin/techReport.js
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
  var techReportPresentation = new tgi.Presentation();
  techReportPresentation.preRenderCallback = function (command, callback) {
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
  var techReportCommand = new tgi.Command({
    name: 'Tech Report',
    theme: 'danger',
    type: 'Presentation',
    icon: 'fa-file-text-o',
    contents: techReportPresentation
  });
  techReportCommand.presentationMode = 'Edit';
  site.adminMenu.push(techReportCommand);

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
    module.contents.push('Enter date range for tech report.');
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
        techReportCommand.execute(designToDo_ui);
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

    /**
     * Get all techs then orders loaded into struc
     */
    module.techs = {};
    var techs = new tgi.List(new site.Tech());
    site.hostStore.getList(techs, {}, {}, function (techList, error) {
      if (error) {
        app.err('Tech getList error: ' + error);
        return;
      }
      /**
       * Build tech lookup
       */
      var gotMore = techList.moveFirst();
      while (gotMore) {
        var tech = {name: techList.get('Name'), orders: 0, sales: 0};
        var id = techList.get('id');
        if (id)
          module.techs[id] = tech;
        gotMore = techList.moveNext();
      }

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
                var PrimaryTechID = orderList.get('PrimaryTechID');
                var InvoiceNumber = orderList.get('InvoiceNumber');
                var InvoiceAmount = orderList.get('InvoiceAmount');
                if (InvoiceNumber.length >= 1 && PrimaryTechID in module.techs) {
                  console.log('#' + InvoiceNumber + ', ' + module.techs[PrimaryTechID].name + ' ' + InvoiceAmount);
                  module.techs[PrimaryTechID].orders++;
                  module.techs[PrimaryTechID].sales += InvoiceAmount;
                }
              }
            }
            gotMore = orderList.moveNext();
          }
          module.viewState = 'REPORT';
          module.freshView = false;
          techReportCommand.execute(designToDo_ui);
        });
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
    args.attributes.push(new tgi.Attribute({name: 'Tech', type: 'String'}));
    args.attributes.push(new tgi.Attribute({name: 'Orders', type: 'Number'}));
    args.attributes.push(new tgi.Attribute({name: 'Sales', type: 'Number'}));
    tgi.Model.call(this, args);
    this.modelType = "ReportDetails";
  };
  ReportDetails.prototype = Object.create(tgi.Model.prototype);

  /**
   * Render Report
   */
  function renderReport() {

    function dollars(amt) {
      return amt.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
    }

    var list = '';
    var details = new ReportDetails();
    var listView = new tgi.List(details);
    for (var tech in module.techs) {
      if (module.techs[tech].orders>0) {
        listView.addItem(new ReportDetails());
        listView.set('Tech', module.techs[tech].name);
        listView.set('Orders', module.techs[tech].orders);
        listView.set('Sales', dollars(module.techs[tech].sales));
      }
    }
    module.contents.push('#### ' + tgi.left(module.dateFrom.value.toISOString(), 10) + ' to ' + tgi.left(module.dateTo.value.toISOString(), 10));
    module.contents.push(listView);
    callbackDone();

  }

  /**
   * force
   */
  // setTimeout(function () {
  //   techReportCommand.execute(ui);
  // }, 0);
}());