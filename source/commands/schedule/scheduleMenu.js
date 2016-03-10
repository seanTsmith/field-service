/**---------------------------------------------------------------------------------------------------------------------
 * field-service/source/commands/schedule/scheduleMenu.js
 */

(function () {
  if (!site.loggedIn) {
    return;
  }

  var scheduleCommand = new tgi.Command({
    name: 'Schedule',
    type: 'Menu',
    theme: 'warning',
    icon: 'fa-file-text',
    contents: site.scheduleMenu
  });
  site.navContents.push(scheduleCommand);

}());