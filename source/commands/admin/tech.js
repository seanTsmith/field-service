/**---------------------------------------------------------------------------------------------------------------------
 * field-service/source/commands/admin/tech.js
 */

(function () {
  var techPresentation = new tgi.Presentation();
  var techMaintenance = new site.ModelMaintenance(site.Tech);
  techPresentation.preRenderCallback = function (command, callback) {
    techMaintenance.preRenderCallback(command, callback);
  };
  var techCommand = new tgi.Command({
    name: 'Tech List',
    theme: 'danger',
    type: 'Presentation',
    icon: 'fa-tech',
    contents: techPresentation
  });
  site.adminMenu.push(techCommand);

  /**
   * force
   */
  //setTimeout(function () {
  //  techCommand.execute(ui);
  //}, 0);

}());