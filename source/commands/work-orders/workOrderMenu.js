/**---------------------------------------------------------------------------------------------------------------------
 * field-service/source/commands/schedule/scheduleMenu.js
 */

(function () {
  if (!site.loggedIn) {
    return;
  }

  var workOrderCommand = new tgi.Command({
    name: 'Work Orders',
    type: 'Menu',
    theme: 'warning',
    icon: 'fa-file-text',
    contents: site.workOrderMenu
  });
  site.navContents.push(workOrderCommand);

}());