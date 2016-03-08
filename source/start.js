/**---------------------------------------------------------------------------------------------------------------------
 * www.tgi.io/source/start.js
 *
 * Final script starts app
 */

(function () {
  var RemoteStore = TGI.STORE.REMOTE().RemoteStore;
  site.hostStore = new RemoteStore({name: 'Host Test Store'});
  var hostAddress = '';
  site.hostStore.onConnect(hostAddress, function (store, err) {
    if (err) {
      console.log('hostStore unavailable (' + err + ')');
    } else {
      console.log('hostStore connected');
      loadTechs();
    }
    console.log(site.hostStore.name + ' ' + site.hostStore.storeType);
  }, {vendor: null, keepConnection: true});

  site.nav.set('contents', site.navContents);
  app.start(function (request) {
    app.info('app got ' + request);
  });

  function loadTechs() {
    site.techList = ['(unassigned)'];
    site.techID = [null];
    site.hostStore.getList(new tgi.List(new site.Tech()),[],{name:1}, function (list, error) {
      if (error) {
        console.log('error loading tech names: ' + error);
      } else {
        var gotMore = list.moveFirst();
        while (gotMore) {
          site.techList.push(list.get('name'));
          site.techID.push(list.get('id'));
          gotMore = list.moveNext();
        }
      }
    });
  }

}());