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
    icon: 'fa-group',
    contents: techPresentation
  });
  site.adminMenu.push(techCommand);

  /**
   * no deletes for now
   */
  techMaintenance.onDelete(function (model, callback) {
      callback(new Error('Techs cannot be deleted you must make inactive.'));
  });


  /**
   * force
   */
  //setTimeout(function () {
  //  techCommand.execute(ui);
  //}, 0);

}());