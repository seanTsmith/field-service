/**---------------------------------------------------------------------------------------------------------------------
 * www.tgi.io/source/commands/about.js
 */
(function () {
  if (!site.loggedIn) {
    return;
  }
  var aboutPresentation = new tgi.Presentation();
  aboutPresentation.preRenderCallback = function (command, callback) {
    site.loadPanel(command, 'commands/about.md', callback);
  };
  var aboutCommand = new tgi.Command({
    name: 'about',
    type: 'Presentation',
    icon: 'fa-info-circle',
    theme: 'default',
    contents: aboutPresentation
  });
  site.navContents.push(aboutCommand);
}());