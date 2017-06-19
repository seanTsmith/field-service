/**---------------------------------------------------------------------------------------------------------------------
 * field-service/source/commands/invoices.js
 */

(function () {
  if (!site.loggedIn) {
    return;
  }
  var invoicePresentation = new tgi.Presentation();
  var invoiceMaintenance = new site.ModelMaintenance(site.Invoice);

  invoicePresentation.preRenderCallback = function (command, callback) {
    invoiceMaintenance.preRenderCallback(command, callback);
  };

  /**
   * After model attributes rendered add each invoice
   */
  invoiceMaintenance.onRenderAttributes(function (invoice, callback) {
    callback([]);
  });

  invoiceMaintenance.onRenderCommands(function (invoice, callback) {
    callback([]);
  });

  var invoiceCommand = new tgi.Command({
    name: 'Invoices',
    theme: 'warning',
    type: 'Presentation',
    icon: 'fa-file-text',
    contents: invoicePresentation
  });
  // site.workOrderMenu.push(invoiceCommand);
  // site.navContents.push(invoiceCommand);

  /**
   * force
   */
  //setTimeout(function () {
  //  invoiceCommand.execute(ui);
  //}, 100);

}());