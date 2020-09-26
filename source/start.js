/**---------------------------------------------------------------------------------------------------------------------
 * field-service/source/start.js
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
      // site.hostStore.transport.onRaw(inbound);
      // site.hostStore.transport.sendRaw('sup foo');
      loadTechs();
    }
    console.log(site.hostStore.name + ' ' + site.hostStore.storeType);
  }, {vendor: null, keepConnection: true});

  site.nav.set('contents', site.navContents);
  app.start(function (request) {
    app.info('app got ' + request);
  });
  /**
   * Messages inbound
   */
  function inbound(msg) {
    switch (msg) {
      case 'exportCustomersCommandOK':
        if (site.exportCustomersCommandOK)
          site.exportCustomersCommandOK();
        break;
      default:
        console.log('inbound (UNKNOWN MSG): ' + msg);
        break;
    }
  }

  function loadTechs() {
    site.techList = ['(unassigned)'];
    site.techListFull = ['(unassigned)'];
    site.techID = [null];
    site.techIDFull = [null];
    site.hostStore.getList(new tgi.List(new site.Tech()),[],{name:1}, function (list, error) {
      if (error) {
        console.log('error loading tech names: ' + error);
      } else {
        var gotMore = list.moveFirst();
        var cnt = 0;
        while (gotMore) {
          site.techListFull.push(list.get('name'));
          site.techIDFull.push(list.get('id'));
          if ((!list.get('Inactive')) && list.get('CellPhone') && list.get('CellPhone').length) {
            if (cnt++ < 20) {
              site.techList.push(list.get('name'));
              site.techID.push(list.get('id'));
            }
          }
          gotMore = list.moveNext();
        }
      }
    });
  }

}());