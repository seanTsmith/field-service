/**---------------------------------------------------------------------------------------------------------------------
 * www.tgi.io/source/utility/model-maintenance.js
 */

var designToDo_ui = ui;

site.ModelMaintenance = function (ModelConstructor) {
  var self = this;
  this.ModelConstructor = ModelConstructor;
  this.model = new ModelConstructor();
  this.viewState = 'SEARCH';
  this.onRenderAttributes(function (model, callback) {
    callback();
  });
  this.onRenderCommands(function (model, callback) {
    callback();
  });
  this.onCustomViewState(function (callback) {
    self.contents.push('UNKNOWN VIEW STATE ' + self.viewState);
    callback();
  });
};
site.ModelMaintenance.prototype.preRenderCallback = function (command, callback) {
  var self = this;
  self.name = self.model.modelType.toLowerCase();
  self.presentation = command.contents;
  self.contents = [];
  self.searchObject = self.searchObject || {}; // preserve
  self.modelID = self.modelID || null; // For model edit
  self.command = command;
  self.callback = callback;

  /**
   * See if we got here from internal refresh or from nav
   */
  if (self.internalRefresh) {
    self.internalRefresh = false;
  } else {
    // Nav refresh
    self.viewState = 'SEARCH';
  }

  /**
   * Prepare the presentation for rendering based on view state
   */
  //console.log('self.viewState ' + self.viewState);
  switch (self.viewState) {
    case 'SEARCH':
      renderSearch();
      break;
    case 'LIST':
      renderList();
      break;
    case 'VIEW':
      renderView();
      break;
    case 'EDIT':
      renderEdit();
      break;
    case 'CUSTOM':
      self._customViewState(callbackDone);
      break;
    default:
      self.contents.push('UNKNOWN VIEW STATE ' + self.viewState);
      callbackDone();
      break;
  }

  /**
   * Callback after async ops done
   */
  function callbackDone() {
    if (!self.internalRefresh) {
      self.viewState = 'SEARCH';
    }
    self.internalRefresh = true;
    self.presentation.set('contents', self.contents);
    callback(command);
  }

  /**
   * VIEW STATE: Search
   */
  function renderSearch() {
    command.presentationMode = 'Edit';
    self.contents.push('Enter any search criteria to locate the ' + self.name + ' and click find or click new to add a ' + self.name + '.');
    self.contents.push('-');
    for (var i = 1; i < self.model.attributes.length; i++) { // copy all attribs except id
      if (self.model.attributes[i].hidden == undefined)
        self.contents.push(self.model.attributes[i]);
    }
    self.contents.push('-');
    self.contents.push(new tgi.Command({
      name: 'Find ' + self.model.modelType,
      theme: 'default',
      icon: 'fa-search',
      type: 'Function',
      contents: function () {
        self.searchObject = {};
        for (var i = 1; i < self.model.attributes.length; i++) { // copy all attribs except id
          var attribute = self.model.attributes[i];
          if (attribute.value) {
            var rex = new RegExp(attribute.value, 'i');
            self.searchObject[attribute.name] = rex;
          }
        }
        self.viewState = 'LIST';
        command.execute(designToDo_ui);
      }
    }));
    self.contents.push(new tgi.Command({
      name: 'New ' + self.model.modelType,
      theme: 'default',
      icon: 'fa-plus-circle',
      type: 'Function',
      contents: function () {
        self.modelID = null;
        self.viewState = 'EDIT';
        command.execute(designToDo_ui);
      }
    }));
    callbackDone();
  }

  /**
   * VIEW STATE: List
   */
  function renderList() {
    command.presentationMode = 'View';
    try {
      var list = new tgi.List(self.model);
      list.pickKludge = function (id) {
        var items = list._items;
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          if (id == item[0]) {
            self.modelID = id;
            self.viewState = 'VIEW';
            command.execute(designToDo_ui);
          }
        }
      };
      site.hostStore.getList(list, self.searchObject, {Customer: 1}, function (list, error) {
        if (typeof error != 'undefined') {
          self.contents.push('#### ' + e);
          console.log('' + e);
          app.err('' + e);
        } else {
          self.contents.push(list);
        }
        callbackDone();
      });
    } catch (e) {
      console.log('' + e);
      app.err('' + e);
      callbackDone();
    }
  }

  /**
   * VIEW STATE: View
   */
  function renderView() {
    command.presentationMode = 'View';

    /**
     * Create a new model in self.viewModel and load if editing existing
     */
    self.viewModel = new self.ModelConstructor();
    if (self.modelID) {
      self.viewModel.set('id', self.modelID);
      try {
        site.hostStore.getModel(self.viewModel, function (model, error) {
          if (error) {
            self.contents.push('Error getting  ' + self.name + ':');
            self.contents.push('' + error);
            callbackDone();
          } else {
            renderModel();
          }
        });
      } catch (e) {
        console.log('error caught ' + e);
      }
    } else {
      renderModel();
    }

    /**
     * Model is ready to be rendered
     */
    function renderModel() {
      for (var i = 1; i < self.viewModel.attributes.length; i++) { // copy all attribs except id
        //console.log('self.model.attributes[i] ' + self.viewModel.attributes[i]);
        if (self.viewModel.attributes[i].value)
          self.contents.push(self.viewModel.attributes[i]);
      }
      self._renderAttributes(self.viewModel, function (afterAttributes) {
        if (afterAttributes) {
          for (var i = 0; i < afterAttributes.length; i++) {
            self.contents.push(afterAttributes[i]);
          }
        }
        self.contents.push('-');
        self.contents.push(new tgi.Command({
          name: '' + self.model.modelType,
          icon: 'fa-pencil-square-o',
          type: 'Function',
          contents: function () {
            self.viewState = 'EDIT';
            command.execute(designToDo_ui);
          }
        }));
        self._renderCommands(self.viewModel, function (afterCommands) {
          if (afterCommands) {
            for (var i = 0; i < afterCommands.length; i++) {
              self.contents.push(afterCommands[i]);
            }
          }
          callbackDone();
        });
      });
    }
  }

  /**
   * VIEW STATE: Edit
   */
  function renderEdit() {
    command.presentationMode = 'Edit';

    /**
     * Create a new model in self.editModel and load if editing existing
     */
    self.editModel = new self.ModelConstructor();
    if (self.modelID) {
      self.editModel.set('id', self.modelID);
      try {
        site.hostStore.getModel(self.editModel, function (model, error) {
          if (error) {
            self.contents.push('Error getting  ' + self.name + ':');
            self.contents.push('' + error);
            callbackDone();
          } else {
            renderModel();
          }
        });
      } catch (e) {
        console.log('error caught ' + e);
      }
    } else {
      renderModel();
    }

    /**
     * Model is ready to be rendered
     */
    function renderModel() {
      if (self.modelID)
        self.contents.push('Make any changes to ' + self.name + ' and press SAVE to update database.');
      else
        self.contents.push('Enter info for ' + self.name + ' and press SAVE to update database.');
      self.contents.push('-');
      for (var i = 1; i < self.editModel.attributes.length; i++) { // copy all attribs except id
        //if (self.model.attributes[i].hidden == undefined)
        self.contents.push(self.editModel.attributes[i]);
      }
      self.contents.push('-');

      self.contents.push(new tgi.Command({
        name: 'Save ' + self.model.modelType,
        theme: 'success',
        icon: 'fa-check-circle',
        type: 'Function',
        contents: saveModel
      }));

      self.contents.push(new tgi.Command({
        name: 'Cancel',
        theme: 'default',
        icon: 'fa-ban',
        type: 'Function',
        contents: function () {
          if (self.modelID) {
            self.viewState = 'VIEW';
            command.execute(designToDo_ui);
          } else {
            self.viewState = 'SEARCH';
            command.execute(designToDo_ui);
          }
        }
      }));

      callbackDone();
    }

    /**
     * Save model
     */
    function saveModel() {
      try {
        site.hostStore.putModel(self.editModel, function (model, error) {
          if (error) {
            self.contents.push('Error putting  ' + self.name + ':');
            self.contents.push('' + error);
          } else {
            self.viewState = 'VIEW';
            command.execute(designToDo_ui);
          }

        });
      } catch (e) {
        console.log('error caught ' + e);
      }
    }
  }
};
site.ModelMaintenance.prototype.onRenderAttributes = function (callback) {
  this._renderAttributes = callback;
};
site.ModelMaintenance.prototype.onRenderCommands = function (callback) {
  this._renderCommands = callback;
};
site.ModelMaintenance.prototype.onCustomViewState = function (callback) {
  this._customViewState = callback;
};
