/**---------------------------------------------------------------------------------------------------------------------
 * /www.tgi.io/source/commands/models/user.js
 */

(function () {
  var userPresentation = new tgi.Presentation();
  var userMaintenance = new site.ModelMaintenance(tgi.User);
  userPresentation.preRenderCallback = function (command, callback) {
    userMaintenance.preRenderCallback(command, callback);
  };
  var userCommand = new tgi.Command({
    name: 'User',
    theme: 'default',
    type: 'Presentation',
    icon: 'fa-user',
    contents: userPresentation
  });
  site.modelsMenu.push(userCommand);

  /**
   * force
   */
  //setTimeout(function () {
  //  userCommand.execute(ui);
  //}, 0);

}());