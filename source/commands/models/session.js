/**---------------------------------------------------------------------------------------------------------------------
 * www.tgi.io/source/commands/models/session.js
 */

(function () {
  var sessionPresentation = new tgi.Presentation();
  var sessionMaintenance = new site.ModelMaintenance(tgi.Session);
  sessionPresentation.preRenderCallback = function (command, callback) {
    sessionMaintenance.preRenderCallback(command, callback);
  };
  var sessionCommand = new tgi.Command({
    name: 'Session',
    type: 'Presentation',
    theme: 'default',
      icon: 'fa-exchange',
    contents: sessionPresentation
  });
  site.modelsMenu.push(sessionCommand);

  /**
   * force
   */
  //setTimeout(function () {
  //  sessionCommand.execute(ui);
  //}, 0);


}());