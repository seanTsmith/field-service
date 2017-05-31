/**---------------------------------------------------------------------------------------------------------------------
 * field-service/source/init.js
 *
 * Initial script for app
 */

/**
 * app is tgi app instance - site is this applications namespace
 */
var app = new tgi.Application({interface: ui});
var site = {};

site.loggedIn = (window.location.href.indexOf('session') > -1);
site.nav = new tgi.Presentation();
site.navContents = [];
site.toolsMenu = [];
site.modelsMenu = [];
site.adminMenu = ['Administrative Functions','-'];
site.workOrderMenu = ['Work Orders','-'];


/**
 * Core models for user and session
 */
site.user = new tgi.User();
site.session = new tgi.Session();

/**
 * get app interface ready
 */
app.setInterface(ui);
app.set('brand', 'Bowen Septic');
app.setPresentation(site.nav);
