/**---------------------------------------------------------------------------------------------------------------------
 * tgi-interface-bootstrap/lib/tgi-interface-bootstrap.lib.js
 */
TGI.INTERFACE = TGI.INTERFACE || {};
TGI.INTERFACE.BOOTSTRAP = function () {
  return {
    version: '0.1.10',
    BootstrapInterface: BootstrapInterface
  };
};

/**---------------------------------------------------------------------------------------------------------------------
 * tgi-interface-bootstrap/lib/tgi-interface-bootstrap.source.js
 */
/**
 * Constructor
 */
var BootstrapInterface = function (args) {
  if (false === (this instanceof Interface)) throw new Error('new operator required');
  args = args || {};
  args.name = args.name || '(unnamed)';
  args.description = args.description || 'a BootstrapInterface';
  args.vendor = args.vendor || null;
  var i;
  var unusedProperties = getInvalidProperties(args, ['name', 'description', 'vendor']);
  var errorList = [];
  for (i = 0; i < unusedProperties.length; i++) errorList.push('invalid property: ' + unusedProperties[i]);
  if (errorList.length > 1)
    throw new Error('error creating Interface: multiple errors');
  if (errorList.length) throw new Error('error creating Interface: ' + errorList[0]);
  // default state
  this.startcallback = null;
  this.stopcallback = null;
  this.mocks = [];
  this.mockPending = false;
  this.doc = {}; // Keep DOM element IDs here
  // args ok, now copy to object
  for (i in args) this[i] = args[i];
};
BootstrapInterface.prototype = Object.create(Interface.prototype);
/**
 * Methods
 */
BootstrapInterface.prototype.canMock = function () {
  return this.vendor ? true : false;
};
BootstrapInterface.prototype.start = function (application, presentation, callback) {
  if (!(application instanceof Application)) throw new Error('Application required');
  if (!(presentation instanceof Presentation)) throw new Error('presentation required');
  if (typeof callback != 'function') throw new Error('callback required');
  this.application = application;
  this.presentation = presentation;
  this.startcallback = callback;
  if (!this.vendor) throw new Error('Error initializing Bootstrap');
  try {
    if (!BootstrapInterface._bs) {
      BootstrapInterface._bs = new this.vendor();
    }
  } catch (e) {
    throw new Error('Error initializing Bootstrap: ' + e);
  }
  /**
   * Add needed html to DOM
   */
  this.htmlPanels();
  this.htmlDialog();
  if (this.presentation.get('contents').length)
    this.htmlNavigation();
};
BootstrapInterface.prototype.dispatch = function (request, response) {
  if (false === (request instanceof Request)) throw new Error('Request required');
  if (response && typeof response != 'function') throw new Error('response callback is not a function');
  var requestHandled = false;
  try {
    if (this.application) {
      if (request.type == 'Command' && request.command.type == 'Presentation') {
        request.command.execute(this);
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
BootstrapInterface.prototype.render = function (command, callback) {
  if (false === (command instanceof Command)) throw new Error('Command object required');
  this.activatePanel(command);
};

/**
 * DOM helper
 */
BootstrapInterface.addEle = function (parent, tagName, className, attributes) {
  var ele = document.createElement(tagName);
  if (className && className.length)
    ele.className = className;
  if (attributes)
    for (var i in attributes)
      if (attributes.hasOwnProperty(i)) ele.setAttribute(i, attributes[i]);

  parent.appendChild(ele);
  return ele;
};
BootstrapInterface.addTopEle = function (parent, tagName, className, attributes) {
  var ele = document.createElement(tagName);
  if (className && className.length)
    ele.className = className;
  if (attributes)
    for (var i in attributes)
      if (attributes.hasOwnProperty(i)) ele.setAttribute(i, attributes[i]);
  if (parent.firstChild)
    parent.insertBefore(ele, parent.firstChild);
  else
    parent.appendChild(ele);
  return ele;
};

/**---------------------------------------------------------------------------------------------------------------------
 * tgi-interface-bootstrap/lib/tgi-interface-bootstrap-navigation.source.js
 */
BootstrapInterface.prototype.htmlNavigation = function () {
  var addEle = BootstrapInterface.addEle;
  this.doc.navBar = addEle(document.body, 'nav', 'navbar navbar-default navbar-fixed-top');
  var navBarContainer = addEle(this.doc.navBar, 'div', 'container');
  this.doc.navBarHeader = addEle(navBarContainer, 'div', 'navbar-header');
  var navBarHeaderButton = addEle(this.doc.navBarHeader, 'button', 'navbar-toggle collapsed', {
    'data-toggle': 'collapse',
    'data-target': '#navbar',
    'aria-expanded': 'false',
    'aria-controls': 'navbar'
  });
  addEle(navBarHeaderButton, 'span', 'icon-bar');
  addEle(navBarHeaderButton, 'span', 'icon-bar');
  addEle(navBarHeaderButton, 'span', 'icon-bar');
  this.doc.navBarBody = addEle(navBarContainer, 'div', 'navbar-collapse collapse', {id: 'navbar'});
  this.doc.navBarAlert = addEle(navBarContainer, 'div', 'container', {style: "margin:0"})
  this.refreshNavigation();
};
BootstrapInterface.prototype.refreshNavigation = function () {
  this.doc.navBarBody.innerHTML = ''; // remove any child nodes
  var addEle = BootstrapInterface.addEle;
  this.doc.navBarLeft = addEle(this.doc.navBarBody, 'ul', 'nav navbar-nav');
  this.doc.navBarRight = addEle(this.doc.navBarBody, 'ul', 'nav navbar-nav navbar-right');
  /**
   * Brand
   */
  addEle(this.doc.navBarHeader, 'a', 'navbar-brand').innerHTML = '<a href="#">' + this.application.get('brand') + '</a>';
  /**
   * Menu
   */
  var menuContents = this.presentation.get('contents');
  var separatorSeen = false;
  for (var menuItem in menuContents) if (menuContents.hasOwnProperty(menuItem)) {
    if (menuContents[menuItem].type == 'Menu') {
      var parentMenu = this.addNavBarListMenu(this.doc.navBarLeft, menuContents[menuItem].name);
      var subMenu = menuContents[menuItem].contents;
      for (var subPres in subMenu)
        if (subMenu.hasOwnProperty(subPres))
          this.addNavBarListItem(parentMenu, subMenu[subPres]);
    } else {
      if (menuContents[menuItem] == '-')
        separatorSeen = true;
      else
        this.addNavigationItem((separatorSeen ? this.doc.navBarRight : this.doc.navBarLeft), menuContents[menuItem]);
    }
  }
};
BootstrapInterface.prototype.addNavigationItem = function (parent, action) {
  var bootstrapInterface = this;
  var listItem = BootstrapInterface.addEle(parent, 'li');
  var icon = '';
  var theme = action.theme || 'default';
  if (action.icon) {
    if (left(action.icon,2) == 'fa')
      icon = '<i class="fa ' + action.icon + '"></i>&nbsp;';
    else
      icon = '<span class="glyphicon ' + action.icon + '"></span>&nbsp;';
    //<a href="#"><span class="glyphicon glyphicon-chevron-down panel-glyph-left text-muted"></span></a>
  }
  //listItem.innerHTML = '<a >' + icon + action.name + '</a>';
  listItem.innerHTML = '<button type="button" class="btn btn-' + theme + ' navbar-btn">' + icon + action.name + '</button>';
  $(listItem).click(function (e) {
    bootstrapInterface.dispatch(new Request({type: 'Command', command: action}));
    e.preventDefault();
  });
};
BootstrapInterface.prototype.addNavBarListItem = function (parent, action, icon) {
  var self = this;
  var html;
  var listItem = document.createElement('li');
  icon = icon || '';
  if (action instanceof Command) {
    html = '<a>' + icon + action.name + '</a>';
    $(listItem).click(function (e) {
      self.dispatch(new Request({type: 'Command', command: action}));
      e.preventDefault();
    });
  } else {
    if (action == '-') {
      listItem.className = 'divider';
    } else {
      listItem.className = 'dropdown-header';
      html = action;
    }
  }
  listItem.innerHTML = html;
  parent.appendChild(listItem);
};
BootstrapInterface.prototype.addNavBarListMenu = function (parent, name) {

  var dropDown = document.createElement('li');
  dropDown.className = "dropdown";
  //dropDown.innerHTML = '<a href="#" class="dropdown-toggle navbar-menu" data-toggle="dropdown">' + name + '<b class="caret"></b></a>';
  dropDown.innerHTML = '<button type="button" class="dropdown-toggle btn btn-default navbar-btn" data-toggle="dropdown">' + name + '&nbsp;<b class="caret"></b></button>';
  // listItem.innerHTML = '<button type="button" class="btn btn-default navbar-btn">' + action.name + '</button>';
  parent.appendChild(dropDown);

  var dropDownMenu = document.createElement('ul');
  dropDownMenu.className = "dropdown-menu";
  dropDown.appendChild(dropDownMenu);

  return dropDownMenu;
};
/**---------------------------------------------------------------------------------------------------------------------
 * tgi-interface-bootstrap/lib/tgi-interface-bootstrap-panels.source.js
 */

/**
 * Called at startup for initial html
 */
BootstrapInterface.prototype.htmlPanels = function () {
  var bootstrapInterface = this;
  var addEle = BootstrapInterface.addEle;

  /**
   * Main container and row for panels
   */
  this.doc.mainContainer = addEle(document.body, 'div', 'container main-container', {role: 'main'});
  this.doc.panelRow = addEle(this.doc.mainContainer, 'div', 'row');
};

/**
 * activatePanel will create if needed, make panel visible and render contents
 */
BootstrapInterface.prototype.activatePanel = function (command) {

  var bootstrapInterface = this;
  var addEle = BootstrapInterface.addEle;
  var addTopEle = BootstrapInterface.addTopEle;
  var presentation = command.contents;
  var name = presentation.get('name') || command.name;
  var theme = command.theme || 'default';
  var icon = command.icon;
  if (icon) {
    if (left(icon, 2) == 'fa')
      icon = '<i class="fa ' + icon + '"></i>&nbsp;';
    else
      icon = '<span class="glyphicon ' + icon + '"></span>&nbsp;';
  }
  var title = icon ? icon + name : name;

  /**
   * this.panels array of panels
   */
  if (typeof this.panels == 'undefined')
    this.panels = [];

  /**
   * See if command already has a panel
   */
  var panel;
  for (var i = 0; (typeof panel == 'undefined') && i < this.panels.length; i++) {
    if (name == this.panels[i].name)
      panel = this.panels[i];
  }

  /**
   * For now destroy and recreate panel
   */
  if (typeof panel != 'undefined') {
    bootstrapInterface.destroyPanel(panel);
    panel = undefined;
  }

  /**
   * If we did not find panel create
   */
  if (typeof panel == 'undefined') {
    panel = {
      name: name,
      listeners: [],
      attributeListeners: [],
      textListeners: []
    };
    this.panels.push(panel);

    /**
     * Main framing and title text
     */
    panel.panelDiv = addTopEle(this.doc.panelRow, 'div', 'panel panel-' + theme, {draggable: 'true'});
    panel.panelHeading = addEle(panel.panelDiv, 'div', 'panel-heading');
    panel.panelTitle = addEle(panel.panelHeading, 'div', 'panel-title');
    panel.panelTitleText = addEle(panel.panelTitle, 'a', 'panel-title-text', {href: '#'});
    panel.panelTitleText.innerHTML = title;
    panel.panelBody = addEle(panel.panelDiv, 'div', 'panel-body bg-' + theme);
    panel.panelWell = addEle(panel.panelBody, 'div', 'well-panel');
    panel.panelForm = addEle(panel.panelWell, 'form', 'form-horizontal');

    /**
     * Close Panel Button
     */
    panel.panelClose = addEle(panel.panelTitle, 'a', undefined, {href: '#'});
    panel.panelClose.innerHTML = '<span class="glyphicon glyphicon-remove panel-glyph-right pull-right text-muted"></span>';
    $(panel.panelClose).click(function (e) {
      bootstrapInterface.destroyPanel(panel);
      e.preventDefault();
    });
    panel.listeners.push(panel.panelClose); // so we can avoid leakage on deleting panel

    /**
     * Hide Panel Button
     */
    panel.panelHide = addEle(panel.panelTitle, 'a', undefined, {href: '#'});
    panel.panelHide.innerHTML = '<span class="glyphicon glyphicon-chevron-down panel-glyph-right pull-right text-muted"></span>';
    $(panel.panelHide).click(function (e) {
      $(panel.panelBody).hide('fast');
      $(panel.panelHide).hide();
      $(panel.panelShow).show();
      e.preventDefault();
    });
    panel.listeners.push(panel.panelHide);

    /**
     * Show Panel Button
     */
    panel.panelShow = addEle(panel.panelTitle, 'a', undefined, {href: '#'});
    panel.panelShow.innerHTML = '<span class="glyphicon glyphicon-chevron-left panel-glyph-right pull-right text-muted"></span>';
    $(panel.panelShow).hide();
    $(panel.panelShow).click(function (e) {
      $(panel.panelBody).show('fast');
      $(panel.panelHide).show();
      $(panel.panelShow).hide();
      e.preventDefault();
    });
    panel.listeners.push(panel.panelShow);

  }

  /**
   * Render panel body
   */
  bootstrapInterface.renderPanelBody(panel, command);
  $(panel.panelBody).show('fast'); //
  $(panel.panelHide).show();
  $(panel.panelShow).hide();
  $('html, body').animate({
    scrollTop: $(panel.panelDiv).offset().top - $(bootstrapInterface.doc.navBar).height() - 8
  }, 250);
};

/**
 * When deleting panel remove references to avoid leakage
 */
BootstrapInterface.prototype.destroyPanel = function (panel) {
  var bootstrapInterface = this;
  var i, ele;
  /**
   * Remove this panel from global panel list
   */
  for (i = 0; i < bootstrapInterface.panels.length; i++) {
    if (panel == bootstrapInterface.panels[i])
      bootstrapInterface.panels.splice(i, 1);
  }
  /**
   * Remove listeners before deleting
   */
  for (i = 0; i < panel.listeners.length; i++) {
    ele = panel.listeners[i];
    $(ele).off();
  }
  for (i = 0; i < panel.attributeListeners.length; i++) {
    ele = panel.attributeListeners[i];
    ele.offEvent();
  }
  for (i = 0; i < panel.textListeners.length; i++) {
    ele = panel.textListeners[i];
    ele.offEvent();
  }

  /**
   * Causes memory leaking when doing soak test
   */
  $('html, body').stop();

  /**
   * Remove panel from
   */
  $(panel.panelDiv).remove();

};

/**
 * renderPanelBody will insert the html into the body of the panel for View presentation mode
 */
BootstrapInterface.prototype.renderPanelBody = function (panel, command) {
  var bootstrapInterface = this;
  var addEle = BootstrapInterface.addEle;
  var i, j, indent = false, txtDiv;
  var contents = command.contents.get('contents');
  panel.buttonDiv = null;
  $(panel.panelForm).empty();
  for (i = 0; i < contents.length; i++) {
    if (typeof contents[i] == 'string') {
      switch (contents[i]) {
        case '-':
          panel.panelForm.appendChild(document.createElement("hr"));
          break;
        case '>':
          indent = true;
          break;
        case '<':
          indent = false;
          break;
        default:
          txtDiv = addEle(panel.panelForm, 'div', indent ? 'col-sm-offset-3' : '');
          txtDiv.innerHTML = marked(contents[i]);
          break;
      }
    }
    if (contents[i] instanceof Text) renderText(contents[i]);
    if (contents[i] instanceof Attribute) renderAttribute(contents[i], command.presentationMode);
    if (contents[i] instanceof List) renderList(contents[i], command.theme);
    if (contents[i] instanceof Command) renderCommand(contents[i]);
  }
  /**
   * function to render Attribute
   */
  function renderText(text) {
    var textDiv = addEle(panel.panelForm, 'div', indent ? 'col-sm-offset-3' : '');
    textDiv.innerHTML = marked(text.get());
    text.onEvent('StateChange', function () {
      textDiv.innerHTML = marked(text.get());
    });
    panel.textListeners.push(text); // so we can avoid leakage on deleting panel
  }

  /**
   * function to render Attribute for Edit
   */
  function renderAttribute(attribute, mode) {

    var daList;
    var daItems;
    var formGroup;
    var label;
    var inputDiv;
    var input;
    var helpTextDiv;
    var sz;
    var button;
    var select;
    var textNode;
    var inputGroupDiv;
    var inputGroupSpan;
    var inputGroupButton;
    var inputGroupDropDownMenu;
    var initSwitchery;
    var items;
    var j;
    var validating;

    /**
     * Create formGroup container and label
     */

    formGroup = addEle(panel.panelForm, 'div', 'form-group');
    addEle(formGroup, 'label', 'col-sm-3 control-label').innerHTML = attribute.label;

    /**
     * Create inputDiv - set with of input based on size of field
     */
    sz = '1';
    if (attribute.size > 2) sz = '2';
    if (attribute.size > 5) sz = '3';
    if (attribute.size > 10) sz = '4';
    if (attribute.size > 20) sz = '5';
    if (attribute.size > 25) sz = '6';
    if (attribute.size > 30) sz = '7';
    if (attribute.size > 40) sz = '8';
    if (attribute.size > 50) sz = '9';
    if (attribute.type == 'Number') sz = '3';
    if (attribute.type == 'Date') sz = '3';
    if (attribute.type == 'Boolean') sz = '3';
    inputDiv = addEle(formGroup, 'div', 'col-sm-' + sz);

    /**
     * Render based on type
     */
    switch (mode + attribute.type) {

      case 'ViewBoolean':
        input = addEle(inputDiv, 'input', 'js-switch');
        input.setAttribute("type", "checkbox");
        if (attribute.value)
          input.setAttribute("checked", "true");

        initSwitchery = new Switchery(input, {
          //color: window.getComputedStyle(panel.panelTitle, null).getPropertyValue('color'),
          color: '#5bc0de', // todo based on panel theme
          secondaryColor: '#dfdfdf',
          className: 'switchery',
          disabled: true,
          disabledOpacity: 0.5,
          speed: '0.1s'
        });
        $(input).on('change', function () {
          attribute.value = input.checked;
        });
        break;

      case 'EditBoolean':
        input = addEle(inputDiv, 'input', 'js-switch');
        input.setAttribute("type", "checkbox");
        if (attribute.value)
          input.setAttribute("checked", "true");

        initSwitchery = new Switchery(input, {
          //color: window.getComputedStyle(panel.panelTitle, null).getPropertyValue('color'),
          color: '#5bc0de', // todo based on panel theme
          secondaryColor: '#dfdfdf',
          className: 'switchery',
          disabled: false,
          disabledOpacity: 0.5,
          speed: '0.1s'
        });
        $(input).on('change', function () {
          attribute.value = input.checked;
        });
        break;

      case 'EditDate':
        inputGroupDiv = addEle(inputDiv, 'div', 'input-group date');
        input = addEle(inputGroupDiv, 'input', 'form-control');
        if (attribute.placeHolder)
          input.setAttribute("placeHolder", attribute.placeHolder);
        if (attribute.value)
          input.value = (1 + attribute.value.getMonth()) + '/' + attribute.value.getDate() + '/' + attribute.value.getFullYear();
        inputGroupSpan = addEle(inputGroupDiv, 'span', 'input-group-addon');
        inputGroupSpan.innerHTML = '<i class="fa fa-calendar"></i>';
        $(inputGroupDiv).datepicker({
          autoclose: true,
          todayBtn: true,
          todayHighlight: true,
          showOnFocus: false
        }).on('hide', function (e) {
          validateInput();
          e.preventDefault();
        });
        panel.listeners.push(inputGroupDiv); // so we can avoid leakage on deleting panel
        break;

      case 'EditNumber':
        input = addEle(inputDiv, 'input', 'form-control');
        if (attribute.placeHolder)
          input.setAttribute("placeHolder", attribute.placeHolder);
        input.setAttribute("type", "number");
        input.setAttribute("maxlength", attribute.size);
        input.setAttribute("value", attribute.value ? attribute.value : 0);
        break;

      case 'EditString':
        if (attribute.quickPick) {
          inputGroupDiv = addEle(inputDiv, 'div', 'input-group');
          input = addEle(inputGroupDiv, 'input', 'form-control');
        } else {
          input = addEle(inputDiv, 'input', 'form-control');
        }
        if (attribute.placeHolder)
          input.setAttribute("placeHolder", attribute.placeHolder);
        input.setAttribute("type", attribute.hint.password ? "password" : "text");
        input.setAttribute("maxlength", attribute.size);
        if (attribute.value)
          input.setAttribute("value", attribute.value);
        if (attribute.quickPick) {
          inputGroupSpan = addEle(inputGroupDiv, 'span', 'input-group-btn');
          inputGroupButton = addEle(inputGroupSpan, 'button', 'btn btn-default dropdown-toggle');
          inputGroupButton.type = 'button';
          inputGroupButton.setAttribute('data-toggle', 'dropdown');
          inputGroupButton.innerHTML = '<span class="caret"></span>';
          daItems = attribute.quickPick;
          daList = '';
          for (j = 0; j < daItems.length; j++) {
            daList += '<li><a href="#">' + daItems[j] + '</a></li>';
          }
          inputGroupDropDownMenu = addEle(inputGroupSpan, 'ul', 'dropdown-menu pull-right');
          inputGroupDropDownMenu.innerHTML = daList;
          $(inputGroupDropDownMenu).click(function (e) {
            input.value = e.originalEvent.srcElement.innerText;
            validateInput();
            e.preventDefault();
          });
          panel.listeners.push(inputGroupDropDownMenu); // so we can avoid leakage on deleting panel
        }
        break;

      case 'ViewDate':
        input = addEle(inputDiv, 'p', 'form-control-static');
        if (attribute.value)
          input.innerHTML = (1 + attribute.value.getMonth()) + '/' + attribute.value.getDate() + '/' + attribute.value.getFullYear();

        break;

      default: // View
        input = addEle(inputDiv, 'p', 'form-control-static');
        input.innerHTML = attribute.value;

    }

    /**
     * When focus lost on attribute - validate it
     */
    var validateInput = function (event) {
      switch (attribute.type) {
        case 'Date':
          attribute.value = (input.value === '') ? null : attribute.coerce(input.value);
          if (attribute.value != null) {
            var mm = attribute.value.getMonth() + 1;
            var dd = attribute.value.getDate();
            var yyyy = attribute.value.getFullYear();
            if (mm < 10) mm = '0' + mm;
            if (dd < 10) dd = '0' + dd;
            input.value = mm + '/' + dd + '/' + yyyy;
          } else {
            input.value = '';
          }
          break;
        default:
          attribute.value = (input.value === '') ? null : attribute.coerce(input.value);
          if (attribute.value != null)
            input.value = attribute.value;
          break;
      }
      attribute.validate(function () {
      });
    };
    /**
     * Validate when focus lost
     */
    $(input).on('focusout', validateInput);
    panel.listeners.push(input); // so we can avoid leakage on deleting panel

    /**
     * Monitor state changes to attribute
     */
    attribute.onEvent('Validate', function () {
      attribute._validationDone = true;
    });
    attribute.onEvent('StateChange', function () {
      switch (mode + attribute.type) {
        case 'EditBoolean':
          if (attribute.value != input.checked)
            $(input).click();
          break;
        case 'EditDate':
          input.value = attribute.value ? '' + (1 + attribute.value.getMonth()) + '/' + attribute.value.getDate() + '/' + attribute.value.getFullYear() : '';
          break;
        case 'EditNumber':
          input.value = attribute.value ? attribute.value : 0;
          break;
        case 'EditString':
          input.value = attribute.value ? '' + attribute.value : '';
          break;
        case 'ViewDate':
          input.innerHTML = attribute.value ? '' + (1 + attribute.value.getMonth()) + '/' + attribute.value.getDate() + '/' + attribute.value.getFullYear() : '';
          break;
        default: // View String
          input.innerHTML = attribute.value;
          break;
      }
      renderHelpText(attribute._validationDone ? attribute.validationMessage : '');
      attribute._validationDone = false;
    });
    panel.attributeListeners.push(attribute); // so we can avoid leakage on deleting panel

    /**
     * For attribute error display
     */
    function renderHelpText(text) {
      if (text) {
        if (!helpTextDiv) {
          helpTextDiv = document.createElement("div");
          helpTextDiv.className = 'col-sm-9 col-sm-offset-3 has-error';
          formGroup.appendChild(helpTextDiv);
        }
        helpTextDiv.innerHTML = '<span style="display: block;" class="help-block">' + text + '</span>';
        $(formGroup).addClass('has-error');
        if (inputGroupButton)
          $(inputGroupButton).addClass('btn-danger');
      } else {
        setTimeout(function () {
          if (helpTextDiv) {
            $(helpTextDiv).remove();
            helpTextDiv = null;
          }
        }, 250);
        $(formGroup).removeClass('has-error');
        if (inputGroupButton)
          $(inputGroupButton).removeClass('btn-danger');
      }
    }
  }

  /**
   * function to render List
   */
  function renderList(list, theme) {


    var txtDiv = document.createElement("table");
    txtDiv.className = 'table table-condensed table-bordered table-hover-' + theme;
    //bootstrapInterface.info(txtDiv.className);

    /**
     * Header
     */
    var tHead = addEle(txtDiv, 'thead');
    var tHeadRow = addEle(tHead, 'tr');
    for (j = 1; j < list.model.attributes.length; j++) { // skip id (0))
      var hAttribute = list.model.attributes[j];
      if (hAttribute.hidden == undefined)
        addEle(tHeadRow, 'th').innerHTML = hAttribute.label;
    }

    /**
     * Now each row in list
     */
    var gotData = list.moveFirst();
    var tBody = addEle(txtDiv, 'tbody');
    while (gotData) {
      var tBodyRow = addEle(tBody, 'tr');
      var idAttribute = list.model.attributes[0];
      $(tBodyRow).data("id", list.get(idAttribute.name));
      $(tBodyRow).click(function (e) {
        // bootstrapInterface.dispatch(new Request({type: 'Command', command: action}));
        // bootstrapInterface.info('you picked #' + $(e.currentTarget).data("id"));
        if (list.pickKludge)
          list.pickKludge($(e.currentTarget).data("id")); // too shitty balls
        e.preventDefault();
      });

      for (j = 1; j < list.model.attributes.length; j++) { // skip id (0))
        var dAttribute = list.model.attributes[j];
        if (dAttribute.hidden == undefined) {
          var dValue = list.get(dAttribute.name);
          switch (dAttribute.type) {
            case 'Date':
              //console.log('dValue=' + dValue);
              // addEle(tBodyRow, 'td').innerHTML = left(dValue.toISOString(), 10);
              // addEle(tBodyRow, 'td').innerHTML = dValue.toString(); // todo use moment.js
              addEle(tBodyRow, 'td').innerHTML = left(dValue.toISOString(), 10);
              break;
            case 'Boolean':
              if (dValue)
                addEle(tBodyRow, 'td').innerHTML = '<i class="fa fa-check-square-o"></i>';
              else
                addEle(tBodyRow, 'td').innerHTML = '<i class="fa fa-square-o"></i>';
              break;
            default:
              if (dValue && dValue.name) // todo instanceof Attribute.ModelID did not work so kludge here
                addEle(tBodyRow, 'td').innerHTML = dValue.name;
              else
                addEle(tBodyRow, 'td').innerHTML = dValue;
          }
        }
      }
      gotData = list.moveNext();
    }
    panel.panelForm.appendChild(txtDiv);

  }

  /**
   * function to render Command
   */
  function renderCommand(command) {

    if (!panel.buttonDiv) {
      var formGroup = addEle(panel.panelForm, 'div', 'form-group');
      panel.buttonDiv = addEle(formGroup, 'div', indent ? 'col-sm-offset-3 col-sm-9' : 'col-sm-9');
    }
    var cmdTheme = command.theme || 'default';
    var button = addEle(panel.buttonDiv, 'button', 'btn btn-' + cmdTheme + ' btn-presentation', {type: 'button'});

    var icon = command.icon;
    if (icon) {
      if (left(icon, 2) == 'fa')
        icon = '<i class="fa ' + icon + '"></i>&nbsp;';
      else
        icon = '<span class="glyphicon ' + icon + '"></span>&nbsp;';
      button.innerHTML = icon + command.name;
    } else {
      button.innerHTML = command.name;
    }

    $(button).on('click', function (event) {
      event.preventDefault();
      bootstrapInterface.dispatch(new Request({type: 'Command', command: command}));
    });
    panel.listeners.push(button); // so we can avoid leakage on deleting panel
  }
};

/**---------------------------------------------------------------------------------------------------------------------
 * tgi-interface-bootstrap/lib/tgi-interface-bootstrap-queries.source.js
 */

/**
 * Called at startup for initial html
 */
BootstrapInterface.prototype.htmlDialog = function () {
  var bootstrapInterface = this;
  var addEle = BootstrapInterface.addEle;
  var modalDialog, modalContent, modalHeader, modalBody, modalFooter, modalOK, modalCancel, modalYes, modalNo, choice;

  /**
   * ok()
   */
  this.doc.okDialog = addEle(document.body, 'div', 'modal fade', {
    tabindex: '-1',
    role: 'dialog',
    'aria-hidden': true
  });
  modalDialog = addEle(this.doc.okDialog, 'div', 'modal-dialog');
  modalContent = addEle(modalDialog, 'div', 'modal-content');
  modalHeader = addEle(modalContent, 'div', 'modal-header', {style: 'text-align: center'});
  this.doc.okDialogTitle = addEle(modalHeader, 'h4', 'modal-title', {style: 'text-align: center'});
  this.doc.okDialogBody = addEle(modalContent, 'div', 'modal-body', {style: 'text-align: center'});
  modalFooter = addEle(modalContent, 'div', 'modal-footer', {style: 'text-align: center'});
  modalOK = addEle(modalFooter, 'button', 'btn btn-primary');
  modalOK.innerHTML = '&nbsp;&nbsp;OK&nbsp;&nbsp;';
  $(modalOK).on('click', function () {
    $(bootstrapInterface.doc.okDialog).modal('hide');
  });
  $(this.doc.okDialog).on('hidden.bs.modal', function (e) {
    if (bootstrapInterface.okcallback) {
      var callback = bootstrapInterface.okcallback;
      delete bootstrapInterface.okcallback;
      callback();
    }
  });
  /**
   * yesno()
   */
  this.doc.yesnoDialog = addEle(document.body, 'div', 'modal fade', {
    tabindex: '-1',
    role: 'dialog',
    'aria-hidden': true
  });
  modalDialog = addEle(this.doc.yesnoDialog, 'div', 'modal-dialog');
  modalContent = addEle(modalDialog, 'div', 'modal-content');
  modalHeader = addEle(modalContent, 'div', 'modal-header', {style: 'text-align: center'});
  this.doc.yesnoDialogTitle = addEle(modalHeader, 'h4', 'modal-title', {style: 'text-align: center'});
  this.doc.yesnoDialogBody = addEle(modalContent, 'div', 'modal-body', {style: 'text-align: center'});
  modalFooter = addEle(modalContent, 'div', 'modal-footer', {style: 'text-align: center'});
  modalYes = addEle(modalFooter, 'button', 'btn btn-success');
  modalYes.innerHTML = '&nbsp;<u>Y</u>es&nbsp;';
  $(modalYes).on('click', function () {
    $(bootstrapInterface.doc.yesnoDialog).modal('hide');
    bootstrapInterface.yesnoResponse = true;
  });
  modalNo = addEle(modalFooter, 'button', 'btn btn-danger');
  modalNo.innerHTML = '&nbsp;<u>N</u>o&nbsp;&nbsp;';
  $(modalNo).on('click', function () {
    $(bootstrapInterface.doc.yesnoDialog).modal('hide');
    bootstrapInterface.yesnoResponse = false;
  });
  $(this.doc.yesnoDialog).on('hidden.bs.modal', function (e) {
    if (bootstrapInterface.yesnocallback) {
      var callback = bootstrapInterface.yesnocallback;
      delete bootstrapInterface.yesnocallback;
      callback(bootstrapInterface.yesnoResponse);
    }
  });
  /**
   * ask()
   */
  this.doc.askDialog = addEle(document.body, 'div', 'modal fade', {
    tabindex: '-1',
    role: 'dialog',
    'aria-hidden': true
  });
  modalDialog = addEle(this.doc.askDialog, 'div', 'modal-dialog');
  modalContent = addEle(modalDialog, 'div', 'modal-content');
  modalHeader = addEle(modalContent, 'div', 'modal-header', {style: 'text-align: center'});
  this.doc.askDialogTitle = addEle(modalHeader, 'h4', 'modal-title', {style: 'text-align: center'});
  modalBody = addEle(modalContent, 'div', 'modal-body', {style: 'text-align: center'});
  this.doc.askDialogPrompt = addEle(modalBody, 'div', 'modal-body');
  this.doc.askDialogInput = addEle(modalBody, 'input', 'form-control', {style: 'margin:0 auto; width:80%;'});
  $(this.doc.askDialogInput).keypress(function (e) {
    if (e.which == 13) {
      bootstrapInterface.askResponse = bootstrapInterface.doc.askDialogInput.value;
      $(bootstrapInterface.doc.askDialog).modal('hide');
    }
  });
  modalFooter = addEle(modalContent, 'div', 'modal-footer', {style: 'text-align: center'});
  modalOK = addEle(modalFooter, 'button', 'btn btn-primary');
  modalOK.innerHTML = '&nbsp;&nbsp;OK&nbsp;&nbsp;';
  $(modalOK).on('click', function () {
    bootstrapInterface.askResponse = bootstrapInterface.doc.askDialogInput.value;
    $(bootstrapInterface.doc.askDialog).modal('hide');
  });
  modalCancel = addEle(modalFooter, 'button', 'btn btn-default');
  modalCancel.innerHTML = 'Cancel';
  $(modalCancel).on('click', function () {
    bootstrapInterface.askResponse = undefined;
    $(bootstrapInterface.doc.askDialog).modal('hide');
  });
  $(this.doc.askDialog).on('hidden.bs.modal', function (e) {
    if (bootstrapInterface.askcallback) {
      var callback = bootstrapInterface.askcallback;
      delete bootstrapInterface.askcallback;
      callback(bootstrapInterface.askResponse);
    }
  });
  $(this.doc.askDialog).on('shown.bs.modal', function (e) {
    $(bootstrapInterface.doc.askDialog).focus();
    $(bootstrapInterface.doc.askDialogInput).focus();
  });
  /**
   * choose()
   */
  this.doc.chooseDialog = addEle(document.body, 'div', 'modal fade', {
    tabindex: '-1',
    role: 'dialog',
    'aria-hidden': true
  });
  modalDialog = addEle(this.doc.chooseDialog, 'div', 'modal-dialog');
  modalContent = addEle(modalDialog, 'div', 'modal-content');
  modalHeader = addEle(modalContent, 'div', 'modal-header', {style: 'text-align: center'});
  this.doc.chooseDialogTitle = addEle(modalHeader, 'h4', 'modal-title', {style: 'text-align: center'});
  modalBody = addEle(modalContent, 'div', 'modal-body', {style: 'text-align: center'});
  this.doc.chooseDialogPrompt = addEle(modalBody, 'div', 'modal-body', {style: 'text-align: center'});
  this.doc.chooseDialogButtons = [];
  choice = addEle(modalBody, 'button', 'btn btn-default btn-block');
  $(choice).on('click', function () {
    bootstrapInterface.doc.chooseDialogChoice = 0;
    $(bootstrapInterface.doc.chooseDialog).modal('hide');
  });
  this.doc.chooseDialogButtons.push(choice);
  choice = addEle(modalBody, 'button', 'btn btn-default btn-block');
  $(choice).on('click', function () {
    bootstrapInterface.doc.chooseDialogChoice = 1;
    $(bootstrapInterface.doc.chooseDialog).modal('hide');
  });
  this.doc.chooseDialogButtons.push(choice);
  choice = addEle(modalBody, 'button', 'btn btn-default btn-block');
  $(choice).on('click', function () {
    bootstrapInterface.doc.chooseDialogChoice = 2;
    $(bootstrapInterface.doc.chooseDialog).modal('hide');
  });
  this.doc.chooseDialogButtons.push(choice);
  choice = addEle(modalBody, 'button', 'btn btn-default btn-block');
  $(choice).on('click', function () {
    bootstrapInterface.doc.chooseDialogChoice = 3;
    $(bootstrapInterface.doc.chooseDialog).modal('hide');
  });
  this.doc.chooseDialogButtons.push(choice);
  choice = addEle(modalBody, 'button', 'btn btn-default btn-block');
  $(choice).on('click', function () {
    bootstrapInterface.doc.chooseDialogChoice = 4;
    $(bootstrapInterface.doc.chooseDialog).modal('hide');
  });
  this.doc.chooseDialogButtons.push(choice);
  choice = addEle(modalBody, 'button', 'btn btn-default btn-block');
  $(choice).on('click', function () {
    bootstrapInterface.doc.chooseDialogChoice = 5;
    $(bootstrapInterface.doc.chooseDialog).modal('hide');
  });
  this.doc.chooseDialogButtons.push(choice);
  choice = addEle(modalBody, 'button', 'btn btn-default btn-block');
  $(choice).on('click', function () {
    bootstrapInterface.doc.chooseDialogChoice = 6;
    $(bootstrapInterface.doc.chooseDialog).modal('hide');
  });
  this.doc.chooseDialogButtons.push(choice);
  choice = addEle(modalBody, 'button', 'btn btn-default btn-block');
  $(choice).on('click', function () {
    bootstrapInterface.doc.chooseDialogChoice = 7;
    $(bootstrapInterface.doc.chooseDialog).modal('hide');
  });
  this.doc.chooseDialogButtons.push(choice);
  modalFooter = addEle(modalContent, 'div', 'modal-footer', {style: 'text-align: center'});
  modalCancel = addEle(modalFooter, 'button', 'btn btn-default btn-block');
  modalCancel.innerHTML = '<b class="text-danger">Cancel</b>';
  $(modalCancel).on('click', function () {
    bootstrapInterface.doc.chooseDialogChoice = undefined;
    $(bootstrapInterface.doc.chooseDialog).modal('hide');
  });
  $(this.doc.chooseDialog).on('hidden.bs.modal', function (e) {
    if (bootstrapInterface.choosecallback) {
      var callback = bootstrapInterface.choosecallback;
      delete bootstrapInterface.choosecallback;
      callback(bootstrapInterface.doc.chooseDialogChoices[bootstrapInterface.doc.chooseDialogChoice]);
    }
  });
};
BootstrapInterface.prototype.info = function (text) {
  var self = this;
  var notify = $.notify(
    {
      /**
       * options
       */
      icon: 'glyphicon glyphicon-info-sign',
      title: 'Information',
      message: text,
      //url: 'https://github.com/mouse0270/bootstrap-notify',
      //target: '_blank'
    },
    {
      /**
       * settings
       */
      element: 'body',
      position: null,
      type: "info",
      allow_dismiss: true,
      newest_on_top: true,
      placement: {
        from: "top",
        align: "right"
      },
      offset: {
        x: 20,
        y: self.doc.navBarHeader.offsetHeight + 20
      },
      spacing: 10,
      z_index: 1031,
      delay: 0,
      timer: 1000,
      //url_target: '_blank',
      mouse_over: null,
      animate: {
        enter: 'animated fadeInDown',
        exit: 'animated fadeOutUp'
      },
      onShow: null,
      onShown: null,
      onClose: null,
      onClosed: null,
      icon_type: 'class',
      template: '<div data-notify="container" class="col-xs-11 col-sm-6 alert alert-notify alert-{0}" role="alert">' +
      '<button type="button" aria-hidden="true" class="close" data-notify="dismiss">×</button>' +
      '<h4>' +
      '<span data-notify="icon"></span> ' +
      '<span data-notify="title">{1}</span>' +
      '</h4>' +
      '<span data-notify="message">{2}</span>' +
      '<div class="progress" data-notify="progressbar">' +
      '<div class="progress-bar progress-bar-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>' +
      '</div>' +
        //'<a href="{3}" target="{4}" data-notify="url"></a>' +
      '</div>'
    }
  );
  setTimeout(function () {
    notify.close();
  }, 3000);
};
BootstrapInterface.prototype.done = function (text) {
  var self = this;
  var notify = $.notify(
    {
      /**
       * options
       */
      icon: 'glyphicon glyphicon-saved',
      title: 'Done',
      message: text
      //url: 'https://github.com/mouse0270/bootstrap-notify',
      //target: '_blank'
    },
    {
      /**
       * settings
       */
      element: 'body',
      position: null,
      type: "success",
      allow_dismiss: true,
      newest_on_top: true,
      placement: {
        from: "top",
        align: "right"
      },
      offset: {
        x: 20,
        y: self.doc.navBarHeader.offsetHeight + 20
      },
      spacing: 10,
      z_index: 1031,
      delay: 0,
      timer: 1000,
      //url_target: '_blank',
      mouse_over: null,
      animate: {
        enter: 'animated fadeInDown',
        exit: 'animated fadeOutUp'
      },
      onShow: null,
      onShown: null,
      onClose: null,
      onClosed: null,
      icon_type: 'class',
      template: '<div data-notify="container" class="col-xs-11 col-sm-6 alert alert-notify alert-{0}" role="alert">' +
      '<button type="button" aria-hidden="true" class="close" data-notify="dismiss">×</button>' +
      '<h4>' +
      '<span data-notify="icon"></span> ' +
      '<span data-notify="title">{1}</span>' +
      '</h4>' +
      '<span data-notify="message">{2}</span>' +
      '<div class="progress" data-notify="progressbar">' +
      '<div class="progress-bar progress-bar-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>' +
      '</div>' +
        //'<a href="{3}" target="{4}" data-notify="url"></a>' +
      '</div>'
    }
  );
  setTimeout(function () {
    notify.close();
  }, 3000);
};
BootstrapInterface.prototype.warn = function (text) {
  var self = this;
  var notify = $.notify(
    {
      /**
       * options
       */
      icon: 'glyphicon glyphicon-exclamation-sign',
      title: 'Warning',
      message: text,
      //url: 'https://github.com/mouse0270/bootstrap-notify',
      //target: '_blank'
    },
    {
      /**
       * settings
       */
      element: 'body',
      position: null,
      type: "warning",
      allow_dismiss: true,
      newest_on_top: true,
      placement: {
        from: "top",
        align: "right"
      },
      offset: {
        x: 20,
        y: self.doc.navBarHeader.offsetHeight + 20
      },
      spacing: 10,
      z_index: 1031,
      delay: 0,
      timer: 1000,
      //url_target: '_blank',
      mouse_over: null,
      animate: {
        enter: 'animated fadeInDown',
        exit: 'animated fadeOutUp'
      },
      onShow: null,
      onShown: null,
      onClose: null,
      onClosed: null,
      icon_type: 'class',
      template: '<div data-notify="container" class="col-xs-11 col-sm-6 alert alert-notify alert-{0}" role="alert">' +
      '<button type="button" aria-hidden="true" class="close" data-notify="dismiss">×</button>' +
      '<h4>' +
      '<span data-notify="icon"></span> ' +
      '<span data-notify="title">{1}</span>' +
      '</h4>' +
      '<span data-notify="message">{2}</span>' +
      '<div class="progress" data-notify="progressbar">' +
      '<div class="progress-bar progress-bar-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>' +
      '</div>' +
        //'<a href="{3}" target="{4}" data-notify="url"></a>' +
      '</div>'
    }
  );
  setTimeout(function () {
    notify.close();
  }, 3000);
};
BootstrapInterface.prototype.err = function (text) {
  var self = this;
  var notify = $.notify(
    {
      /**
       * options
       */
      icon: 'glyphicon glyphicon-warning-sign',
      title: 'Error',
      message: text,
      //url: 'https://github.com/mouse0270/bootstrap-notify',
      //target: '_blank'
    },
    {
      /**
       * settings
       */
      element: 'body',
      position: null,
      type: "danger",
      allow_dismiss: true,
      newest_on_top: true,
      placement: {
        from: "top",
        align: "right"
      },
      offset: {
        x: 20,
        y: self.doc.navBarHeader.offsetHeight + 20
      },
      spacing: 10,
      z_index: 1031,
      delay: 0,
      timer: 1000,
      //url_target: '_blank',
      mouse_over: null,
      animate: {
        enter: 'animated fadeInDown',
        exit: 'animated fadeOutUp'
      },
      onShow: null,
      onShown: null,
      onClose: null,
      onClosed: null,
      icon_type: 'class',
      template: '<div data-notify="container" class="col-xs-11 col-sm-6 alert alert-notify alert-{0}" role="alert">' +
      '<button type="button" aria-hidden="true" class="close" data-notify="dismiss">×</button>' +
      '<h4>' +
      '<span data-notify="icon"></span> ' +
      '<span data-notify="title">{1}</span>' +
      '</h4>' +
      '<span data-notify="message">{2}</span>' +
      '<div class="progress" data-notify="progressbar">' +
      '<div class="progress-bar progress-bar-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>' +
      '</div>' +
        //'<a href="{3}" target="{4}" data-notify="url"></a>' +
      '</div>'
    }
  );
  setTimeout(function () {
    notify.close();
  }, 3000);
};
BootstrapInterface.prototype.ok = function (prompt, callback) {
  if (!prompt || typeof prompt !== 'string') throw new Error('prompt required');
  if (typeof callback != 'function') throw new Error('callback required');
  if (this.okPending) {
    delete this.okPending;
    callback();
  } else {
    this.doc.okDialogTitle.innerHTML = this.application ? this.application.get('brand') : '?';
    this.doc.okDialogBody.innerHTML = prompt;
    $(this.doc.okDialog).modal();
    this.okcallback = callback;
  }
};
BootstrapInterface.prototype.yesno = function (prompt, callback) {
  if (!prompt || typeof prompt !== 'string') throw new Error('prompt required');
  if (typeof callback != 'function') throw new Error('callback required');
  if (this.yesnoPending) {
    delete this.yesnoPending;
    callback(this.yesnoResponse);
  } else {
    this.doc.yesnoDialogTitle.innerHTML = this.application.get('brand');
    this.doc.yesnoDialogBody.innerHTML = prompt;
    $(this.doc.yesnoDialog).modal();
    this.yesnocallback = callback;
  }
};
BootstrapInterface.prototype.ask = function (prompt, attribute, callback) {
  if (!prompt || typeof prompt !== 'string') throw new Error('prompt required');
  if (false === (attribute instanceof Attribute)) throw new Error('attribute or callback expected');
  if (typeof callback != 'function') throw new Error('callback required');
  if (this.askPending) {
    delete this.askPending;
    callback(this.askResponse);
  } else {
    this.doc.askDialogTitle.innerHTML = this.application.get('brand');
    this.doc.askDialogPrompt.innerHTML = prompt + '<br><br>';
    $(this.doc.askDialog).modal();
    this.askcallback = callback;
  }
};
BootstrapInterface.prototype.choose = function (prompt, choices, callback) {
  if (!prompt || typeof prompt !== 'string') throw new Error('prompt required');
  if (false === (choices instanceof Array)) throw new Error('choices array required');
  if (!choices.length) throw new Error('choices array empty');
  if (typeof callback != 'function') throw new Error('callback required');
  if (this.choosePending) {
    delete this.choosePending;
    callback(Interface.firstMatch(this.chooseResponse, choices));
  } else {
    if (choices.length > this.doc.chooseDialogButtons.length) throw new Error('max choices reached in choose');
    this.doc.chooseDialogTitle.innerHTML = this.application.get('brand');
    this.doc.chooseDialogPrompt.innerHTML = prompt.replace(/\n/g, '<br>');
    $(this.doc.chooseDialog).modal();
    this.choosecallback = callback;
    this.doc.chooseDialogChoices = choices;
    for (var i = 0; i < this.doc.chooseDialogButtons.length; i++) {
      if (i < choices.length) {
        this.doc.chooseDialogButtons[i].innerHTML = '<b class="text-primary">' + choices[i] + '</b>';
        $(this.doc.chooseDialogButtons[i]).show();
      } else {
        $(this.doc.chooseDialogButtons[i]).hide();
      }
    }
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
