/**---------------------------------------------------------------------------------------------------------------------
 * field-service/source/commands/schedule/workOrders.js
 */

(function () {
  var techPresentation = new tgi.Presentation();
  var techMaintenance = new site.ModelMaintenance(site.Tech);
  techPresentation.preRenderCallback = function (command, callback) {
    techMaintenance.preRenderCallback(command, callback);
  };
  var techCommand = new tgi.Command({
    name: 'Work Orders',
    theme: 'warning',
    type: 'Presentation',
    icon: 'fa-truck',
    contents: techPresentation
  });
  site.scheduleMenu.push(techCommand);

  /**
   * force
   */
  //setTimeout(function () {
  //  techCommand.execute(ui);
  //}, 0);

}());