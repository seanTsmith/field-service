/**---------------------------------------------------------------------------------------------------------------------
 * www.tgi.io/source/commands/tools/create-data-set.js
 */

(function () {

  /**
   * System model
   */
  var SysInfo = function (args) {
    tgi.Model.call(this, args);
    this.modelType = "SysInfo";
    this.attributes.push(new tgi.Attribute({name: 'dataRevision', type: 'Number'}));
  };
  SysInfo.prototype = Object.create(tgi.Model.prototype);

  var user;
  var createDataSetCommand = new tgi.Command({
    name: 'create dataset', type: 'Procedure', contents: new tgi.Procedure({
      tasks: [
        /**
         * Make sure database does not exist
         */
          function () {
          console.log('Make sure database does not exist');
          var task = this;
          try {
            var sysInfoList = new tgi.List(new SysInfo());
            site.hostStore.getList(sysInfoList, {}, {}, function (list, error) {
              console.log('got list: ' + list);
              if (typeof error != 'undefined') {
                app.err('error getting list' + error);
                task.abort();
              } else {
                if (sysInfoList.length() > 0) {
                  app.warn('database already exists');
                  task.abort();
                } else {
                  task.complete();
                }
              }
            });
          } catch (e) {
            app.err('error getting list' + e);
          }
        },
        /**
         * Create SysInfo
         */
          function () {
          console.log('Create SysInfo');
          var task = this;
          try {
            sysInfo = new SysInfo();
            sysInfo.set('dataRevision', 1);
            site.hostStore.putModel(sysInfo, function (model, error) {
              if (typeof error != 'undefined') {
                app.err('error creating sysInfo' + error);
                task.abort();
              } else {
                task.complete();
              }
            });
          } catch (e) {
            app.err('error creating SysInfo' + e);
          }
        },
        /**
         * Create admin
         */
          function () {
          console.log('Create admin');
          var task = this;
          try {
            user = new tgi.User();
            user.set('name', 'super');
            user.set('active', true);
            user.set('password', 'septic');
            user.set('firstName', 'Super');
            user.set('lastName', 'Septic');
            site.hostStore.putModel(user, function (model, error) {
              if (typeof error != 'undefined') {
                app.err('error creating admin' + error);
                task.abort();
              } else {
                task.complete();
              }
            });
          } catch (e) {
            app.err('error creating admin' + e);
          }
        }
      ]
    })
  });
  createDataSetCommand.onEvent('Completed', function (event) {
    if (this.status == 1)
      app.done('Dataset created successfully.')
    else
      app.warn('Dataset procedure failed.')
  });
  site.toolsMenu.push(createDataSetCommand);
}());
