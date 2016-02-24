/**---------------------------------------------------------------------------------------------------------------------
 * www.tgi.io/source/commands/login.js
 */

(function () {
  if (site.loggedIn) {
    return;
  }
  var loginPresentation = new tgi.Presentation();
  var login, password, loginButton;
  loginPresentation.set('contents', [
    '>',
    '**Please login**',
    '-',
    login = new tgi.Attribute({
      name: 'login',
      label: 'Login',
      type: 'String(20)',
      validationRule: {required: true},
      value: ''
    }),
    password = new tgi.Attribute({
      name: 'password',
      label: 'Password',
      type: 'String(20)',
      validationRule: {required: true},
      hint: {password: true},
      value: ''
    }),
    '>',
    new tgi.Command({name: 'Login', type: 'Function', theme: 'info', icon: 'fa-sign-in', contents: loginSession})
  ]);

  var loginCommand = new tgi.Command({
    name: 'login',
    type: 'Presentation',
    //theme: 'info',
    icon: 'fa-sign-in',
    presentationMode: 'Edit',
    contents: loginPresentation
  });

  site.navContents.push('-'); // Right justify if interface supports
  site.navContents.push(loginCommand);

  /**
   * After start, force login
   */
  setTimeout(function () {
    loginCommand.execute(ui);
  }, 250);

  /**
   * Start session when info submitted
   */
  function loginSession() {
    try {
      loginPresentation.validate(function () {
        if (loginPresentation.validationMessage) {
          app.info(loginPresentation.validationMessage != 'contents has validation errors' ? loginPresentation.validationMessage : 'login and password required');
          return;
        }
        site.session.startSession(site.hostStore, login.value, password.value, '*', function (err, session) {
          if (err) {
            app.err('' + err);
          } else {
            window.location = window.location.href + '?session=' + session.get('id');
            //app.info('session ' + session.get('id'));
            // window.location.href
            // window.location = "http://www.yoururl.com";
          }
        });
      });
    } catch (e) {
      console.log('err ' + e);
    }
  }
}());
