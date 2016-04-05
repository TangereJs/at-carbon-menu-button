(function(module) {
  'use strict';

  /**
   * Class constructor for dropdown MDL component.
   * Implements MDL component design pattern defined at:
   * https://github.com/jasonmayes/mdl-component-design-pattern
   *
   * @constructor
   * @param {HTMLElement} element The element that will be upgraded.
   */
  var MaterialMenu = function MaterialMenu(element, componentRoot) {
    this.MaterialMenu.prototype.element_ = element;
    this.MaterialMenu.prototype.componentRoot_ = componentRoot;
    // Initialize instance.
    this.MaterialMenu.prototype.init();
    return this.MaterialMenu.prototype;
  };
  module['MaterialMenu'] = MaterialMenu;

  /**
   * Store constants in one place so they can be updated easily.
   *
   * @enum {string | number}
   * @private
   */
  MaterialMenu.prototype.Constant_ = {
    // Total duration of the menu animation.
    TRANSITION_DURATION_SECONDS: 0.3,
    // The fraction of the total duration we want to use for menu item animations.
    TRANSITION_DURATION_FRACTION: 0.8,
    // How long the menu stays open after choosing an option (so the user can see
    // the ripple).
    CLOSE_TIMEOUT: 150
  };

  /**
   * Keycodes, for code readability.
   *
   * @enum {number}
   * @private
   */
  MaterialMenu.prototype.Keycodes_ = {
    ENTER: 13,
    ESCAPE: 27,
    SPACE: 32,
    UP_ARROW: 38,
    DOWN_ARROW: 40
  };

  /**
   * Store strings for class names defined by this component that are used in
   * JavaScript. This allows us to simply change it in one place should we
   * decide to modify at a later date.
   *
   * @enum {string}
   * @private
   */
  MaterialMenu.prototype.CssClasses_ = {
    CONTAINER: 'mdl-menu__container',
    OUTLINE: 'mdl-menu__outline',
    ITEM: 'mdl-menu__item',
    ITEM_RIPPLE_CONTAINER: 'mdl-menu__item-ripple-container',
    RIPPLE_EFFECT: 'mdl-js-ripple-effect',
    RIPPLE_IGNORE_EVENTS: 'mdl-js-ripple-effect--ignore-events',
    RIPPLE: 'mdl-ripple',
    // Statuses
    IS_UPGRADED: 'is-upgraded',
    IS_VISIBLE: 'is-visible',
    IS_ANIMATING: 'is-animating',
    // Alignment options
    BOTTOM_LEFT: 'mdl-menu--bottom-left', // This is the default.
    BOTTOM_RIGHT: 'mdl-menu--bottom-right',
    TOP_LEFT: 'mdl-menu--top-left',
    TOP_RIGHT: 'mdl-menu--top-right',
    UNALIGNED: 'mdl-menu--unaligned'
  };

  /**
   * Initialize element.
   */
  MaterialMenu.prototype.init = function() {
    if (this.element_) {
      // Create container for the menu.
      var container = document.createElement('div');
      Polymer.dom(container).classList.add(this.CssClasses_.CONTAINER);
      Polymer.dom(this.element_.parentElement).insertBefore(container, this.element_);
      Polymer.dom(this.element_.parentElement).removeChild(this.element_);
      Polymer.dom(container).appendChild(this.element_);
      this.container_ = container;

      // Create outline for the menu (shadow and background).
      var outline = document.createElement('div');
      Polymer.dom(outline).classList.add(this.CssClasses_.OUTLINE);
      this.outline_ = outline;
      Polymer.dom(container).insertBefore(outline, this.element_);

      // Find the "for" element and bind events to it.
      var forElId = this.element_.getAttribute('for') || this.element_.getAttribute('data-mdl-for');
      var forEl = null;
      if (forElId) {
        forEl = Polymer.dom(this.componentRoot_).querySelector('#'+forElId);
        if (forEl) {
          this.forElement_ = forEl;
          this.boundHandleForClick_ = this.handleForClick_.bind(this);
          forEl.addEventListener('click', this.boundHandleForClick_);
          this.boundHandleKeyboardEvent_ = this.handleForKeyboardEvent_.bind(this);
          forEl.addEventListener('keydown', this.boundHandleKeyboardEvent_);
        }
      }

      var items = Polymer.dom(this.element_).querySelectorAll('.' + this.CssClasses_.ITEM);
      this.boundItemKeydown_ = this.handleItemKeyboardEvent_.bind(this);
      this.boundItemClick_ = this.handleItemClick_.bind(this);
      for (var i = 0; i < items.length; i++) {
        // Add a listener to each menu item.
        items[i].addEventListener('click', this.boundItemClick_);
        // Add a tab index to each menu item.
        items[i].tabIndex = '-1';
        // Add a keyboard listener to each menu item.
        items[i].addEventListener('keydown', this.boundItemKeydown_);
      }

      // Add ripple classes to each item, if the user has enabled ripples.
      if (this.element_.classList.contains(this.CssClasses_.RIPPLE_EFFECT)) {
        Polymer.dom(this.element_).classList.add(this.CssClasses_.RIPPLE_IGNORE_EVENTS);

        for (var j = 0; j < items.length; j++) {
          var item = items[j];

          var rippleContainer = document.createElement('span');
          Polymer.dom(rippleContainer).classList.add(this.CssClasses_.ITEM_RIPPLE_CONTAINER);

          var ripple = document.createElement('span');
          Polymer.dom(ripple).classList.add(this.CssClasses_.RIPPLE);
          Polymer.dom(rippleContainer).appendChild(ripple);

          Polymer.dom(item).appendChild(rippleContainer);
          Polymer.dom(item).classList.add(this.CssClasses_.RIPPLE_EFFECT);
        }
      }

      // Copy alignment classes to the container, so the outline can use them.
      if (this.element_.classList.contains(this.CssClasses_.BOTTOM_LEFT)) {
        Polymer.dom(this.outline_).classList.add(this.CssClasses_.BOTTOM_LEFT);
      }
      if (this.element_.classList.contains(this.CssClasses_.BOTTOM_RIGHT)) {
        Polymer.dom(this.outline_).classList.add(this.CssClasses_.BOTTOM_RIGHT);
      }
      if (this.element_.classList.contains(this.CssClasses_.TOP_LEFT)) {
        Polymer.dom(this.outline_).classList.add(this.CssClasses_.TOP_LEFT);
      }
      if (this.element_.classList.contains(this.CssClasses_.TOP_RIGHT)) {
        Polymer.dom(this.outline_).classList.add(this.CssClasses_.TOP_RIGHT);
      }
      if (this.element_.classList.contains(this.CssClasses_.UNALIGNED)) {
        Polymer.dom(this.outline_).classList.add(this.CssClasses_.UNALIGNED);
      }

      Polymer.dom(container).classList.add(this.CssClasses_.IS_UPGRADED);
    }
  };

  /**
   * Tears down previous instance of material menu; reverse of init
   */
  MaterialMenu.prototype.tearDown = function () {
    // this.element_ is the element being downgraded
    var container = this.element_.parentElement;
    var containerParent = container.parentElement;
    var outline = Polymer.dom(container).querySelector('.mdl-menu__outline');

    // remove this.element_ from container
    Polymer.dom(container).removeChild(this.element_);
    this.container_ = false;
    // remove outline from container
    Polymer.dom(container).removeChild(outline);
    this.outline_ = false;
    // remove container
    Polymer.dom(containerParent).removeChild(container);
    // append this.element_ to original location
    Polymer.dom(containerParent).appendChild(this.element_);

    // Find the "for" element and unbind events form it.
    this.forElement_ = false;
    var forElId = this.element_.getAttribute('for') || this.element_.getAttribute('data-mdl-for');
    var forEl = null;
    if (forElId) {
      forEl = Polymer.dom(this.componentRoot_).querySelector('#'+forElId);
      if (forEl) {
        forEl.removeEventListener('click', this.boundHandleForClick_);
        this.boundHandleForClick_ = false;
        forEl.removeEventListener('keydown', this.boundHandleKeyboardEvent_);
        this.boundHandleKeyboardEvent_ = false;
      }
    }

    var items = Polymer.dom(this.element_).querySelectorAll('.' + this.CssClasses_.ITEM);
    for (var i = 0; i < items.length; i++) {
      // Remove a listener to each menu item.
      items[i].removeEventListener('click', this.boundItemClick_);
      // Remove a tab index to each menu item.
      items[i].tabIndex = '';
      // Remove a keyboard listener to each menu item.
      items[i].removeEventListener('keydown', this.boundItemKeydown_);
    }
    this.boundItemKeydown_ = false;
    this.boundItemClick_ = false;

    // Remove ripple classes from each item, if the user has enabled ripples.
    if (this.element_.classList.contains(this.CssClasses_.RIPPLE_EFFECT)) {
      Polymer.dom(this.element_).classList.remove(this.CssClasses_.RIPPLE_IGNORE_EVENTS);

      for (var j = 0; j < items.length; j++) {
        var item = items[j];

        var rippleContainer = Polymer.dom(item).querySelector('.' + this.CssClasses_.ITEM_RIPPLE_CONTAINER);
        if (rippleContainer) {
          Polymer.dom(item).removeChild(rippleContainer);
        }

        Polymer.dom(item).classList.remove(this.CssClasses_.RIPPLE_EFFECT);
      }
    }
  };

  /**
   * Handles a click on the "for" element, by positioning the menu and then
   * toggling it.
   *
   * @param {Event} evt The event that fired.
   * @private
   */
  MaterialMenu.prototype.handleForClick_ = function(evt) {
    if (this.element_ && this.forElement_) {
      var rect = this.forElement_.getBoundingClientRect();
      var forRect = this.forElement_.parentElement.getBoundingClientRect();

      if (this.element_.classList.contains(this.CssClasses_.UNALIGNED)) {
        // Do not position the menu automatically. Requires the developer to
        // manually specify position.
      } else if (this.element_.classList.contains(
          this.CssClasses_.BOTTOM_RIGHT)) {
        // Position below the "for" element, aligned to its right.
        this.container_.style.right = (forRect.right - rect.right) + 'px';
        this.container_.style.top =
          this.forElement_.offsetTop + this.forElement_.offsetHeight + 'px';
      } else if (this.element_.classList.contains(this.CssClasses_.TOP_LEFT)) {
        // Position above the "for" element, aligned to its left.
        this.container_.style.left = this.forElement_.offsetLeft + 'px';
        this.container_.style.bottom = (forRect.bottom - rect.top) + 'px';
      } else if (this.element_.classList.contains(this.CssClasses_.TOP_RIGHT)) {
        // Position above the "for" element, aligned to its right.
        this.container_.style.right = (forRect.right - rect.right) + 'px';
        this.container_.style.bottom = (forRect.bottom - rect.top) + 'px';
      } else {
        // Default: position below the "for" element, aligned to its left.
        this.container_.style.left = this.forElement_.offsetLeft + 'px';
        this.container_.style.top =
          this.forElement_.offsetTop + this.forElement_.offsetHeight + 'px';
      }
    }

    this.toggle(evt);
  };

  /**
   * Handles a keyboard event on the "for" element.
   *
   * @param {Event} evt The event that fired.
   * @private
   */
  MaterialMenu.prototype.handleForKeyboardEvent_ = function(evt) {
    if (this.element_ && this.container_ && this.forElement_) {
      var items = Polymer.dom(this.element_).querySelectorAll('.' + this.CssClasses_.ITEM + ':not([disabled])');

      if (items && items.length > 0 &&
        this.container_.classList.contains(this.CssClasses_.IS_VISIBLE)) {
        if (evt.keyCode === this.Keycodes_.UP_ARROW) {
          evt.preventDefault();
          items[items.length - 1].focus();
        } else if (evt.keyCode === this.Keycodes_.DOWN_ARROW) {
          evt.preventDefault();
          items[0].focus();
        }
      }
    }
  };

  /**
   * Handles a keyboard event on an item.
   *
   * @param {Event} evt The event that fired.
   * @private
   */
  MaterialMenu.prototype.handleItemKeyboardEvent_ = function(evt) {
    if (this.element_ && this.container_) {
      var items = Polymer.dom(this.element_).querySelectorAll('.' + this.CssClasses_.ITEM + ':not([disabled])');

      if (items && items.length > 0 &&
        this.container_.classList.contains(this.CssClasses_.IS_VISIBLE)) {
        var currentIndex =
          Array.prototype.slice.call(items).indexOf(evt.target);

        if (evt.keyCode === this.Keycodes_.UP_ARROW) {
          evt.preventDefault();
          if (currentIndex > 0) {
            items[currentIndex - 1].focus();
          } else {
            items[items.length - 1].focus();
          }
        } else if (evt.keyCode === this.Keycodes_.DOWN_ARROW) {
          evt.preventDefault();
          if (items.length > currentIndex + 1) {
            items[currentIndex + 1].focus();
          } else {
            items[0].focus();
          }
        } else if (evt.keyCode === this.Keycodes_.SPACE ||
          evt.keyCode === this.Keycodes_.ENTER) {
          evt.preventDefault();
          // Send mousedown and mouseup to trigger ripple.
          var e = new MouseEvent('mousedown');
          evt.target.dispatchEvent(e);
          e = new MouseEvent('mouseup');
          evt.target.dispatchEvent(e);
          // Send click.
          evt.target.click();
        } else if (evt.keyCode === this.Keycodes_.ESCAPE) {
          evt.preventDefault();
          this.hide();
        }
      }
    }
  };

  /**
   * Handles a click event on an item.
   *
   * @param {Event} evt The event that fired.
   * @private
   */
  MaterialMenu.prototype.handleItemClick_ = function(evt) {
    if (evt.target.hasAttribute('disabled')) {
      evt.stopPropagation();
    } else {
      // Wait some time before closing menu, so the user can see the ripple.
      this.closing_ = true;
      window.setTimeout(function() {
        this.hide();
        this.closing_ = false;
      }.bind(this), /** @type {number} */ (this.Constant_.CLOSE_TIMEOUT));
    }
  };

  /**
   * Calculates the initial clip (for opening the menu) or final clip (for closing
   * it), and applies it. This allows us to animate from or to the correct point,
   * that is, the point it's aligned to in the "for" element.
   *
   * @param {number} height Height of the clip rectangle
   * @param {number} width Width of the clip rectangle
   * @private
   */
  MaterialMenu.prototype.applyClip_ = function(height, width) {
    if (this.element_.classList.contains(this.CssClasses_.UNALIGNED)) {
      // Do not clip.
      this.element_.style.clip = '';
    } else if (
      this.element_.classList.contains(this.CssClasses_.BOTTOM_RIGHT)) {
      // Clip to the top right corner of the menu.
      this.element_.style.clip =
        'rect(0 ' + width + 'px 0 ' + width + 'px)';
    } else if (this.element_.classList.contains(this.CssClasses_.TOP_LEFT)) {
      // Clip to the bottom left corner of the menu.
      this.element_.style.clip =
        'rect(' + height + 'px 0 ' + height + 'px 0)';
    } else if (this.element_.classList.contains(this.CssClasses_.TOP_RIGHT)) {
      // Clip to the bottom right corner of the menu.
      this.element_.style.clip = 'rect(' + height + 'px ' + width + 'px ' +
        height + 'px ' + width + 'px)';
    } else {
      // Default: do not clip (same as clipping to the top left corner).
      this.element_.style.clip = '';
    }
  };

  /**
   * Cleanup function to remove animation listeners.
   *
   * @param {Event} evt The event being handled.
   * @private
   */

  MaterialMenu.prototype.removeAnimationEndListener_ = function(evt) {
    Polymer.dom(evt.target).classList.remove(MaterialMenu.prototype.CssClasses_.IS_ANIMATING);
  };

  /**
   * Adds an event listener to clean up after the animation ends.
   *
   * @private
   */
  MaterialMenu.prototype.addAnimationEndListener_ = function() {
    this.element_.addEventListener(
      'transitionend', this.removeAnimationEndListener_);
    this.element_.addEventListener(
      'webkitTransitionEnd', this.removeAnimationEndListener_);
  };

  /**
   * Displays the menu.
   *
   * @param {Event} evt The event being handled.
   * @public
   */
  MaterialMenu.prototype.show = function(evt) {
    if (this.element_ && this.container_ && this.outline_) {
      // Measure the inner element.
      var height = this.element_.getBoundingClientRect().height;
      var width = this.element_.getBoundingClientRect().width;

      // Apply the inner element's size to the container and outline.
      this.container_.style.width = width + 'px';
      this.container_.style.height = height + 'px';
      this.outline_.style.width = width + 'px';
      this.outline_.style.height = height + 'px';

      var transitionDuration = this.Constant_.TRANSITION_DURATION_SECONDS *
        this.Constant_.TRANSITION_DURATION_FRACTION;

      // Calculate transition delays for individual menu items, so that they fade
      // in one at a time.
      var items = Polymer.dom(this.element_).querySelectorAll('.' + this.CssClasses_.ITEM);
      for (var i = 0; i < items.length; i++) {
        var itemDelay = null;
        if (this.element_.classList.contains(this.CssClasses_.TOP_LEFT) ||
          this.element_.classList.contains(this.CssClasses_.TOP_RIGHT)) {
          itemDelay = ((height - items[i].offsetTop - items[i].offsetHeight) /
            height * transitionDuration) + 's';
        } else {
          itemDelay = (items[i].offsetTop / height * transitionDuration) + 's';
        }
        items[i].style.transitionDelay = itemDelay;
      }

      // Apply the initial clip to the text before we start animating.
      this.applyClip_(height, width);

      // Wait for the next frame, turn on animation, and apply the final clip.
      // Also make it visible. This triggers the transitions.
      requestAnimationFrame(function() {
        Polymer.dom(this.element_).classList.add(this.CssClasses_.IS_ANIMATING);
        this.element_.style.clip = 'rect(0 ' + width + 'px ' + height + 'px 0)';
        Polymer.dom(this.container_).classList.add(this.CssClasses_.IS_VISIBLE);
      }.bind(this));

      // Clean up after the animation is complete.
      this.addAnimationEndListener_();

      // Add a click listener to the document, to close the menu.
      var callback = function(e) {
        // Check to see if the document is processing the same event that
        // displayed the menu in the first place. If so, do nothing.
        // Also check to see if the menu is in the process of closing itself, and
        // do nothing in that case.
        // Also check if the clicked element is a menu item
        // if so, do nothing.
        if (e !== evt && !this.closing_ &&
          e.target.parentNode !== this.element_) {
          document.removeEventListener('click', callback);
          this.hide();
        }
      }.bind(this);
      document.addEventListener('click', callback);
    }
  };
  MaterialMenu.prototype['show'] = MaterialMenu.prototype.show;

  /**
   * Hides the menu.
   *
   * @public
   */
  MaterialMenu.prototype.hide = function() {
    if (this.element_ && this.container_ && this.outline_) {
      var items = Polymer.dom(this.element_).querySelectorAll('.' + this.CssClasses_.ITEM);

      // Remove all transition delays; menu items fade out concurrently.
      for (var i = 0; i < items.length; i++) {
        items[i].style.removeProperty('transition-delay');
      }

      // Measure the inner element.
      var rect = this.element_.getBoundingClientRect();
      var height = rect.height;
      var width = rect.width;

      // Turn on animation, and apply the final clip. Also make invisible.
      // This triggers the transitions.
      Polymer.dom(this.element_).classList.add(this.CssClasses_.IS_ANIMATING);
      this.applyClip_(height, width);
      Polymer.dom(this.container_).classList.remove(this.CssClasses_.IS_VISIBLE);

      // Clean up after the animation is complete.
      this.addAnimationEndListener_();
    }
  };
  MaterialMenu.prototype['hide'] = MaterialMenu.prototype.hide;

  /**
   * Displays or hides the menu, depending on current state.
   *
   * @param {Event} evt The event being handled.
   * @public
   */
  MaterialMenu.prototype.toggle = function(evt) {
    if (this.container_.classList.contains(this.CssClasses_.IS_VISIBLE)) {
      this.hide();
    } else {
      this.show(evt);
    }
  };
  MaterialMenu.prototype['toggle'] = MaterialMenu.prototype.toggle;

  // The component registers itself. It can assume componentHandler is available
  // in the global scope.
  // componentHandler.register({
  //   constructor: MaterialMenu,
  //   classAsString: 'MaterialMenu',
  //   cssClass: 'mdl-js-menu',
  //   widget: true
  // });
})(window.AtCarbon = window.AtCarbon || {});
