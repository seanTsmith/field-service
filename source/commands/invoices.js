/**---------------------------------------------------------------------------------------------------------------------
 * field-service/source/commands/invoices.js
 */

(function () {
  var customerPresentation = new tgi.Presentation();
  var customerMaintenance = new site.ModelMaintenance(site.Customer);
  customerPresentation.preRenderCallback = function (command, callback) {
    customerMaintenance.preRenderCallback(command, callback);
  };
  var customerCommand = new tgi.Command({
    name: 'Invoices',
    theme: 'success',
    type: 'Presentation',
    icon: 'fa-folder',
    contents: customerPresentation
  });
  //site.modelsMenu.push(customerCommand);
  site.navContents.push(customerCommand);

  /**
   * force
   */
  //setTimeout(function () {
  //  customerCommand.execute(ui);
  //}, 0);

}());