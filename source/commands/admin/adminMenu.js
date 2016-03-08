/**---------------------------------------------------------------------------------------------------------------------
 * field-service/source/commands/admin/adminMenu.js
 */

(function () {

  var adminCommand = new tgi.Command({
    name: 'Admin',
    type: 'Menu',
    theme: 'danger',
    contents: site.adminMenu
  });
  site.navContents.push(adminCommand);
}());