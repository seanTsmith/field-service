/**---------------------------------------------------------------------------------------------------------------------
 * tgi-interface-framework7/lib/tgi-interface-framework7.lib.js
 */
TGI.INTERFACE = TGI.INTERFACE || {};
TGI.INTERFACE.FRAMEWORK7 = function () {
  return {
    version: '0.0.4',
    Framework7Interface: Framework7Interface
  };
};

/**---------------------------------------------------------------------------------------------------------------------
 * tgi-interface-framework7/lib/tgi-interface-framework7.source.js
 */
/**
 * Constructor
 */
var Framework7Interface = function (args) {
  if (false === (this instanceof Interface)) throw new Error('new operator required');
  args = args || {};
  args.name = args.name || '(unnamed)';
  args.description = args.description || 'a Framework7Interface';
  args.vendor = args.vendor || null;
  var i;
  var unusedProperties = getInvalidProperties(args, ['name', 'description', 'vendor']);
  var errorList = [];
  for (i = 0; i < unusedProperties.length; i++) errorList.push('invalid property: ' + unusedProperties[i]);
  if (errorList.length > 1)
    throw new Error('error creating Interface: multiple errors');
  if (errorList.length) throw new Error('error creating Interface: ' + errorList[0]);
  // default state
  this.startCallback = null;
  this.stopCallback = null;
  this.mocks = [];
  this.mockPending = false;
  // args ok, now copy to object
  for (i in args) this[i] = args[i];
};
Framework7Interface.prototype = Object.create(Interface.prototype);
/**
 * Methods
 */
Framework7Interface.prototype.canMock = function () {
  return this.vendor ? true : false;
};
Framework7Interface.prototype.start = function (application, presentation, callback) {
  if (!(application instanceof Application)) throw new Error('Application required');
  if (!(presentation instanceof Presentation)) throw new Error('presentation required');
  if (typeof callback != 'function') throw new Error('callback required');
  this.application = application;
  this.presentation = presentation;
  this.startCallback = callback;
  if (!this.vendor) throw new Error('Error initializing Framework7');
  try {
    if (!Framework7Interface._f7) {
      Framework7Interface._f7 = new this.vendor();
    }
  } catch (e) {
    throw new Error('Error initializing Framework7: ' + e);
  }
  /**
   * Add needed html to DOM
   */
  this.doc = {}; // Keep DOM element IDs here todo move all variables of Framework7Interface in here to avoid future namespace collisions
  if (this.presentation.get('contents').length)
    this.htmlNavigation();
  this.htmlViews();
};
Framework7Interface.prototype.dispatch = function (request, response) {
  if (false === (request instanceof Request)) throw new Error('Request required');
  if (response && typeof response != 'function') throw new Error('response callback is not a function');
  var requestHandled = false;
  try {
    if (this.application) {
      if (request.type == 'Command' && request.command.type == 'Presentation') {
        framework7Interface.showView(request.command);
        // this.activatePanel(request.command);
        requestHandled = true;
      } else {
        requestHandled = this.application.dispatch(request);
      }
    }
    if (!requestHandled && this.startcallback) {
      this.startcallback(request);
    }
  } catch (e) {
    if (this.startcallback) {
      this.startcallback(e);
    }
  }
};
Framework7Interface.prototype.render = function (command, callback) {

  var framework7Interface = this;
  if (false === (command instanceof Command)) throw new Error('Command object required');

  var presentation = command.contents;

  /**
   * find the presentation on the toolbar first
   */
  for (var i = 0; i < framework7Interface.toolBarCommands.length; i++) {
    var toolBarLink = framework7Interface.toolBarCommands[i];
    if (toolBarLink.command.contents === presentation) {
      framework7Interface.showView(toolBarLink);
      return;
    }
  }
  /**
   * Now look in more menu
   */
  for (i = 0; i < framework7Interface.toolBarMoreCommands.length; i++) {
    toolBarLink = framework7Interface.toolBarMoreCommands[i];
    if (toolBarLink.command.contents === presentation) {
      framework7Interface.showView(toolBarLink);
      return;
    }
  }
};

/**
 * DOM helper
 */
Framework7Interface.addEle = function (parent, tagName, className, attributes) {
  var ele = document.createElement(tagName);
  if (className && className.length)
    ele.className = className;
  if (attributes)
    for (var i in attributes)
      if (attributes.hasOwnProperty(i)) ele.setAttribute(i, attributes[i]);
  parent.appendChild(ele);
  return ele;
};

/**---------------------------------------------------------------------------------------------------------------------
 * lib/tgi-interface-framework7-navigation.source.js
 */
Framework7Interface.prototype.htmlNavigation = function () {
  var addEle = Framework7Interface.addEle;

  /**
   * Main View
   */
  document.body.innerHTML = '' +
    '<div class="statusbar-overlay"></div>' + // Status bar overlay for full screen mode (PhoneGap)
    '<div class="panel-overlay"></div>'; // Panels overlay
  this.views = addEle(document.body, 'div', 'views', {id: 'views'});// F7 Views Div
  this.viewMain = addEle(this.views, 'div', 'view view-main', {id: 'viewMain'});// Tell F7 this is the main view
  /**
   * Nav Bar (Top)
   */
  this.navBar = addEle(this.viewMain, 'div', 'navbar', {id: 'navBar'}); // Top NavBar
  this.navBarInner = addEle(this.navBar, 'div', 'navbar-inner', {id: 'navBarInner'}); // NavBar Inner
  //this.brand = addEle(this.navBarInner, 'div', 'center sliding', {id: 'brand'}); // NavBar Inner
  this.leftOfBrand = addEle(this.navBarInner, 'div', 'left'); // placeholder for proper alignment
  this.brand = addEle(this.navBarInner, 'div', 'center', {id: 'brand'}); // Brand
  this.rightOfBrand = addEle(this.navBarInner, 'div', 'right');  // placeholder for proper alignment
  this.brand.innerText = this.application.get('brand');

  /**
   * Toolbar (Bottom)
   */
  this.toolBar = addEle(this.viewMain, 'div', 'toolbar tabbar tabbar-labels', {id: 'toolBar'});
  this.toolBarInner = addEle(this.toolBar, 'div', 'toolbar-inner', {id: 'toolBarInner'});
  this.refreshNavigation();
};
Framework7Interface.prototype.refreshNavigation = function () {
  var framework7Interface = this;
  var addEle = Framework7Interface.addEle;
  var $$ = Dom7;
  /**
   * (re)initialize structure
   */
  framework7Interface.toolBarInner.innerHTML = '';
  framework7Interface.toolBarCommands = [];
  framework7Interface.toolBarMoreCommands = [];
  /**
   * Prep main menu
   */
  var menuContents = framework7Interface.presentation.get('contents');
  var menuCount = 0; // Count only menu items
  for (var menuItem in menuContents)
    if (menuContents.hasOwnProperty(menuItem) && typeof menuContents[menuItem] != 'string')
      menuCount++;
  /**
   * determine max icons that can fit
   */
  var iconMaxFit = 6;
  var baseIconWidth = 64;
  if (framework7Interface.toolBar.clientWidth > 400) baseIconWidth = 96;
  if (framework7Interface.toolBar.clientWidth > 768) baseIconWidth = 112;
  if (framework7Interface.toolBar.clientWidth) iconMaxFit = Math.floor(framework7Interface.toolBar.clientWidth / baseIconWidth);
  var needMore = (menuCount > iconMaxFit);
  var iconsToShow = needMore ? iconMaxFit - 1 : menuCount;
  var iconsShowing = 0;
  /**
   * create each toolbar link - add to more... if no room
   */
  var moreMenu = [];
  for (menuItem in menuContents) {
    if (menuContents.hasOwnProperty(menuItem) && typeof menuContents[menuItem] != 'string') {
      if (iconsShowing < iconsToShow) {
        iconsShowing++;
        addLink(menuContents[menuItem]);
      } else {
        moreMenu.push(menuContents[menuItem]);
        var link = {
          command: menuContents[menuItem],
          domElement: null,
          id: null, // id for domElement so we can find in DOM
          primaryView: null, // views are lazy created
          subMenu: [] // if needed for nested menus
        };
        framework7Interface.toolBarMoreCommands.push(link);
      }
    }
  }
  if (needMore) {
    addLink(new Command({name: 'more', icon: 'fa-ellipsis-h', type: 'Menu', contents: moreMenu}));
  }
  function addLink(item) {
    var link = {
      command: item,
      domElement: null,
      id: null, // id for domElement so we can find in DOM
      primaryView: null, // views are lazy created
      subMenu: [] // if needed for nested menus
    };
    framework7Interface.toolBarCommands.push(link);
    link.id = 'tbLink' + (framework7Interface.toolBarCommands.length);
    link.domElement = addEle(framework7Interface.toolBarInner, 'a', 'tab-link', {id: link.id, href: '#'});
    link.domElement.innerHTML = '<i class="fa ' + (item.icon || 'fa-circle-thin') + ' fa-lg"></i><span class="tabbar-label">' + item.name + '</span>';
    $$('#' + link.id).on('click', function () {
      link.command.execute(framework7Interface);
    });
  }
};
Framework7Interface.prototype.highlightToolBarCommand = function (toolBarCommand) {
  var $$ = Dom7;
  for (var i = 0; i < this.toolBarCommands.length; i++) {
    var cmd = this.toolBarCommands[i];
    $$(cmd.domElement).removeClass('active');
  }
  $$(toolBarCommand.domElement).addClass('active');
};
Framework7Interface.prototype.updateBrand = function (text) {
  this.brand.innerText = text;
};

/**---------------------------------------------------------------------------------------------------------------------
 * lib/tgi-interface-framework7-queries.source.js
 */
Framework7Interface.prototype.info = function (text) {
  if (!text || typeof text !== 'string') throw new Error('text required');
  Framework7Interface._f7.addNotification({title: 'Information', message: text, hold:3000});
};
Framework7Interface.prototype.done = function (text) {
  if (!text || typeof text !== 'string') throw new Error('text required');
  Framework7Interface._f7.addNotification({title: 'Success', message: text, hold:3000});
};
Framework7Interface.prototype.warn = function (text) {
  if (!text || typeof text !== 'string') throw new Error('text required');
  Framework7Interface._f7.addNotification({title: 'Warning', message: text, hold:3000});
};
Framework7Interface.prototype.err = function (text) {
  if (!text || typeof text !== 'string') throw new Error('text required');
  Framework7Interface._f7.addNotification({title: 'ERROR', message: text, hold:3000});
};
Framework7Interface.prototype.ok = function (prompt, callback) {
  if (!prompt || typeof prompt !== 'string') throw new Error('prompt required');
  if (typeof callback != 'function') throw new Error('callback required');
  if (this.okPending) {
    delete this.okPending;
    callback();
  } else {
    Framework7Interface._f7.alert(prompt.replace(/\n/g,'<br>'), this.application.get('brand'), function () {
      callback();
    });
  }
};
Framework7Interface.prototype.yesno = function (prompt, callback) {
  if (!prompt || typeof prompt !== 'string') throw new Error('prompt required');
  if (typeof callback != 'function') throw new Error('callback required');
  if (this.yesnoPending) {
    delete this.yesnoPending;
    callback(this.yesnoResponse);
  } else {
    Framework7Interface._f7.modal({
      text:prompt.replace(/\n/g,'<br>'),
      title: this.application.get('brand'),
      verticalButtons: true,
      buttons: [{
        text: 'Yes',
        onClick: function () {
          callback(true);
        }
      },{
        text: 'No',
        onClick: function () {
          callback(false);
        }
      }]
    });
  }
};
Framework7Interface.prototype.ask = function (prompt, attribute, callback) {
  if (!prompt || typeof prompt !== 'string') throw new Error('prompt required');
  if (false === (attribute instanceof Attribute)) throw new Error('attribute or callback expected');
  if (typeof callback != 'function') throw new Error('callback required');
  if (this.askPending) {
    delete this.askPending;
    callback(this.askResponse);
  } else {
    Framework7Interface._f7.prompt(prompt.replace(/\n/g,'<br>'), this.application.get('brand'),
      function (answer) {
        callback(answer);
      },
      function () {
        callback();
      }
    );
  }
};
Framework7Interface.prototype.choose = function (prompt, choices, callback) {
  if (!prompt || typeof prompt !== 'string') throw new Error('prompt required');
  if (false === (choices instanceof Array)) throw new Error('choices array required');
  if (!choices.length) throw new Error('choices array empty');
  if (typeof callback != 'function') throw new Error('callback required');
  if (this.choosePending) {
    delete this.choosePending;
    callback(Interface.firstMatch(this.chooseResponse, choices));
  } else {
    var groups = [];
    groups.push([{text: prompt.replace(/\n/g,'<br>'), label: true}]);
    if (choices.length > 0) groups.push([{text: choices[0], onClick: cb0}]);
    if (choices.length > 1) groups.push([{text: choices[1], onClick: cb1}]);
    if (choices.length > 2) groups.push([{text: choices[2], onClick: cb2}]);
    if (choices.length > 3) groups.push([{text: choices[3], onClick: cb3}]);
    if (choices.length > 4) groups.push([{text: choices[4], onClick: cb4}]);
    if (choices.length > 5) groups.push([{text: choices[5], onClick: cb5}]);
    if (choices.length > 6) groups.push([{text: choices[6], onClick: cb6}]);
    if (choices.length > 7) groups.push([{text: choices[7], onClick: cb7}]);
    if (choices.length > 8) groups.push([{text: choices[8], onClick: cb8}]);
    if (choices.length > 9) groups.push([{text: choices[9], onClick: cb9}]);
    if (choices.length > 10) throw new Error('max choices reached in choose');
    groups.push([{text: 'Cancel', color: 'red', onClick: cbCancel}]);
    Framework7Interface._f7.actions(groups);
  }
  /**
   * Since framework does not return any info in callback
   */
  function cbCancel() {
    callback();
  }

  function cb0() {
    callback(choices[0]);
  }

  function cb1() {
    callback(choices[1]);
  }

  function cb2() {
    callback(choices[2]);
  }

  function cb3() {
    callback(choices[3]);
  }

  function cb4() {
    callback(choices[4]);
  }

  function cb5() {
    callback(choices[5]);
  }

  function cb6() {
    callback(choices[6]);
  }

  function cb7() {
    callback(choices[7]);
  }

  function cb8() {
    callback(choices[8]);
  }

  function cb9() {
    callback(choices[9]);
  }
};
/**---------------------------------------------------------------------------------------------------------------------
 * lib/tgi-interface-framework7-views.source.js
 */
Framework7Interface.prototype.htmlViews = function () {
  var framework7Interface = this;
  var addEle = Framework7Interface.addEle;
  var $$ = Dom7;
  /**
   * F7 Pages container, because we use fixed-through navbar and toolbar, it has additional appropriate classes
   */
  framework7Interface.pages = addEle(framework7Interface.viewMain, 'div', 'pages navbar-through toolbar-through', {id: 'pages'}); // F7 Pages container
  framework7Interface.dataPage = addEle(framework7Interface.pages, 'div', 'page', {
    id: 'dataPage',
    'data-page': 'index'
  }); // F7 data-page
  framework7Interface.pageContent = addEle(framework7Interface.dataPage, 'div', 'page-content', {id: 'pageContent'}); // F7 page-content
  framework7Interface.tabs = addEle(framework7Interface.pageContent, 'div', 'tabs', {id: 'tabs'}); // F7 tabs
  /**
   * Starter page
   */
  var starterPage = addEle(framework7Interface.tabs, 'div', 'tab active', {id: 'starterPage'});
  addEle(starterPage, 'div', 'content-block-title').innerHTML = framework7Interface.application.get('brand');
  framework7Interface.tempLog = addEle(starterPage, 'div', 'content-block');
  framework7Interface.tempLog.innerHTML = 'Touch the icons below to explore!'; // todo app overide generic nature of this
};
Framework7Interface.prototype.showView = function (toolBarCommand) {
  var framework7Interface = this;
  var addEle = Framework7Interface.addEle;
  var $$ = Dom7;
  var command = toolBarCommand.command;
  /**
   * Lazy Create DOM stuff
   */
  if (!toolBarCommand.primaryView) {
    toolBarCommand.primaryView = addEle(framework7Interface.tabs, 'div', 'tab');
    switch (command.type) {
      case 'Menu':
        createMenuView(toolBarCommand.command.contents);
        break;
      case 'Presentation':
        createPresentationView(toolBarCommand.command.contents);
        break;
      default:
        addEle(toolBarCommand.primaryView, 'div', 'content-block-title').innerHTML = toolBarCommand.command.name;
        toolBarCommand.primaryViewBlock = addEle(toolBarCommand.primaryView, 'div', 'content-block');
        toolBarCommand.primaryViewBlock.innerHTML = JSON.stringify(toolBarCommand.command);
        break;
    }
  }
  /**
   * Create presentation view
   */
  function createPresentationView(presentation) {
    var contents = presentation.get('contents');
    var contentBlock = addEle(toolBarCommand.primaryView, 'div', 'content-block-presentation');
    var i, j;
    var buttonRow, buttonsInRow = 0;
    var attributeUL;
    for (i = 0; i < contents.length; i++) {
      // String markdown or separator '-'
      if (typeof contents[i] == 'string') {
        if (contents[i] == '-') {
          addEle(contentBlock, 'HR');
        } else {
          var txtDiv = addEle(contentBlock, 'div');
          txtDiv.innerHTML = marked(contents[i]);
        }
      }
      if (contents[i] instanceof Command) {
        renderCommand(contents[i]);
      }
      if (contents[i] instanceof Attribute) {
        renderAttribute(contents[i]);
      } else if (contents[i] instanceof List) {
        renderList(contents[i], command.theme);
      } else {
        attributeUL = undefined;
      }

    }
    /**
     * function to render Attribute
     */
    function renderAttribute(attribute) {
      var i;
      if (!attributeUL) {
        attributeUL = addEle(addEle(contentBlock, 'div', 'list-block'), 'ul');
      }
      // Label
      var item = addEle(addEle(attributeUL, 'div', 'item-content'), 'div', 'item-inner');
      var label = addEle(item, 'div', 'item-title label');
      label.innerHTML = attribute.label;
      // Value
      var inputAttributes = {type: 'text', value: attribute.value || ''};
      if (attribute.hint.password)
        inputAttributes.type = 'password';
      if (attribute.placeHolder)
        inputAttributes.placeholder = attribute.placeHolder;
      if (attribute.size)
        inputAttributes.maxlength = attribute.size;

      var itemInput = addEle(item, 'div', 'item-input');
      var input;
      switch (attribute.type) {
        case 'Boolean':
          var labelSwitch = addEle(itemInput, 'label', 'label-switch');
          inputAttributes.type = 'checkbox';
          //inputAttributes.value = inputAttributes.value ? 'checked' : '';
          input = addEle(labelSwitch, 'input', undefined, inputAttributes);
          input.checked = inputAttributes.value;
          addEle(labelSwitch, 'div', 'checkbox');
          break;
        case 'Date':
          inputAttributes.type = 'date';
          break;
        case 'Number':
          inputAttributes.type = 'number';
          break;
      }
      if (attribute.quickPick) {
        var items = '';
        for (i = 0; i < attribute.quickPick.length; i++) {
          items += '<option>' + attribute.quickPick[i] + '</option>';
        }
        itemInput.innerHTML = '<select>' + items + '</select>';
      } else {
        input = input || addEle(itemInput, 'input', undefined, inputAttributes);
      }
    }

    /**
     * function to render List
     */

    function renderList(list, theme) {

      var listBlock = addEle(toolBarCommand.primaryView, 'div', 'list-block');
      var ul = addEle(listBlock, 'ul');

      /**
       * Now each row in list
       */
      var gotData = list.moveFirst();
      console.log('shit');
      while (gotData) {
        var title = '';
        var subtitle = '';
        var li = addEle(ul, 'li');
        var anchor = addEle(li, 'a', 'item-link item-content', {href: '#'});
        var ii = addEle(anchor, 'div', 'item-inner');
        var idAttribute = list.model.attributes[0];

        $$(anchor).data("id", list.get(idAttribute.name));

        for (j = 1; j < list.model.attributes.length; j++) { // skip id (0))
          var dAttribute = list.model.attributes[j];
          if (j == 1)
            title = list.get(dAttribute.name);
          else
            subtitle += ((subtitle.length ? ' ' : '') + list.get(dAttribute.name));
        }
        addEle(ii, 'div', 'item-title').innerHTML = title;
        if (subtitle.length)
          addEle(ii, 'div', 'item-subtitle').innerHTML = subtitle;

        $$(anchor).on('click', function (e) {
          //console.log('doh');
          //framework7Interface.info('meh');
          framework7Interface.info('you picked #' + $$(e.currentTarget).data("id"));
        });

        gotData = list.moveNext();
      }
      contentBlock = addEle(toolBarCommand.primaryView, 'div', 'content-block-presentation');
    }


    /**
     * function to render Command
     */
    function renderCommand(commandButton) {

      var icon = commandButton.icon;
      var className = commandButton.theme || 'default';
      if (className == 'default')
        className = 'default-presentation';

      if (!icon) {
        switch (commandButton.type) {
          case "Menu":
            icon = 'fa-th-large';
            break;
          case "Presentation":
            icon = 'fa-building';
            break;
          case "Function":
            icon = 'fa-gear';
            break;
          case "Procedure":
            icon = 'fa-gears';
            break;
          default:
            icon = 'fa-square-o';
            break;
        }
      }
      if (!buttonRow) {
        buttonRow = addEle(contentBlock, 'div', 'row button-row');
      }
      var buttonCol = addEle(buttonRow, 'div', 'col-50');
      var buttonAnchor = addEle(buttonCol, 'a', 'button no-select button-' + className, {href: '#'});

      buttonAnchor.innerHTML = '<i class="fa ' + icon + '">&nbsp</i>' + commandButton.name;
      if (++buttonsInRow >= 2) {
        buttonsInRow = 0;
        buttonRow = undefined;
      }
      $$(buttonAnchor).on('click', function (event) {
        commandButton.execute(framework7Interface);
        event.preventDefault();
      });
    }
  }

  /**
   * Create menu views
   */
  function createMenuView(menu) {
    var listBlock = addEle(toolBarCommand.primaryView, 'div', 'list-block');
    for (var i = 0; i < menu.length; i++) {
      var item = menu[i];
      var ul = addEle(listBlock, 'ul');
      if (typeof item == 'string') {
        if (item != '-')
          addEle(ul, 'p').innerHTML = item;
      } else {
        var link = {
          command: item,
          domElement: null,
          id: null
        };
        toolBarCommand.subMenu.push(link);
        link.id = toolBarCommand.id + '-' + (toolBarCommand.subMenu.length);
        var li = addEle(ul, 'li');
        link.domElement = addEle(li, 'a', 'item-link', {id: link.id, href: '#'});
        var itemContent = addEle(link.domElement, 'div', 'item-content');
        var itemMedia = addEle(itemContent, 'div', 'item-media');
        var itemInner = addEle(itemContent, 'div', 'item-inner');
        addEle(itemMedia, 'i', 'fa ' + (item.icon || 'fa-circle-thin') + ' fa-lg');
        addEle(itemInner, 'div', 'item-title').innerHTML = item.name;
        $$('#' + link.id).on('click', function () {
          var htmlID = $$(this).attr('id');
          var dash = htmlID.indexOf('-') + 1;
          var rootID = left(htmlID, dash - 1);
          var toolBarCommandNo = parseInt(right(rootID, rootID.length - 6)) - 1;
          var subMenuNo = parseInt(right(htmlID, htmlID.length - dash)) - 1;
          var dashizzle = framework7Interface.toolBarCommands[toolBarCommandNo].subMenu[subMenuNo];
          if (dashizzle.command.type == 'Stub')
            framework7Interface.info('The ' + dashizzle.command.name + ' feature is not available at this time.');
          else
            dashizzle.command.execute(framework7Interface);
        });
      }
    }
  }

  /**
   * Reflect view state
   */
  framework7Interface.activateView(toolBarCommand.primaryView);
  framework7Interface.updateBrand(command.name);
  framework7Interface.highlightToolBarCommand(toolBarCommand);
};
Framework7Interface.prototype.activateView = function (view) {

  var i, cmd, $$ = Dom7;
  $$('#starterPage').removeClass('active');
  for (i = 0; i < this.toolBarCommands.length; i++) {
    cmd = this.toolBarCommands[i];
    $$(cmd.primaryView).removeClass('active');
  }
  for (i = 0; i < this.toolBarMoreCommands.length; i++) {
    cmd = this.toolBarMoreCommands[i];
    $$(cmd.primaryView).removeClass('active');
  }
  $$(view).addClass('active');
};
