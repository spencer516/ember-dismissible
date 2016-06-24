/*
  Parts of this file were adapted from ic-modal...
  https://github.com/instructure/ic-modal
  Released under The MIT License (MIT)
  Copyright (c) 2014 Instructure, Inc.

  ...and from Ember Liquid Fire
  https://github.com/ember-animation/liquid-fire
  Release under the MIT License (MIT)
  Copyright (c) 2014 Edward Faulkner
*/

import Ember from 'ember';
import isFastboot from '../is-fastboot';
import '../tabbable';
import layout from '../templates/components/dismissible-panel';
const ESCAPE = 27;
const TAB = 9;

const {
  get, run,
  $: e$
} = Ember;

/**
 * If you do something to move focus outside of the browser (like
 * command+l to go to the address bar) and then tab back into the
 * window, capture it and focus the first tabbable element in an active
 * modal.
 */
let lastOpenedModal = null;
if (!isFastboot) {
  e$(document).on('focusin', handleTabIntoBrowser);
}

function handleTabIntoBrowser() {
  if (lastOpenedModal) {
    lastOpenedModal.focus();
  }
}

export default Ember.Component.extend({
  layout,
  attributeBindings: ['tabindex'],
  tabindex: 0,

  keyUp(event) {
    if (event.keyCode === ESCAPE) {
      this.handleDismiss();
    }
  },

  handleDismiss() {
    this.sendAction();
  },

  didInsertElement() {
    this._previousFocus = document.activeElement;
    this.setupListeners();
    this.focus();
    lastOpenedModal = this;
  },

  willDestroyElement() {
    this.teardownListeners();
    lastOpenedModal = null;

    if (this._previousFocus) {
      this._previousFocus.focus();
      delete this._previousFocus;
    }
  },

  keyDown(event) {
    if (event.keyCode === TAB) {
      return this.constrainTabNavigation(event);
    }

    return true;
  },

  focus() {
    if (get(this, 'element').contains(document.activeElement)) {
      return;
    }

    let target = this.$('[autofocus]');
    if (!target.length) {
      target = this.$(':tabbable');
    }

    if (!target.length) {
      target = this.$();
    }

    target.get(0).focus();
  },

  constrainTabNavigation(event) {
    let $tabbable = this.$(':tabbable');
    let shift = event.shiftKey;
    let lastTabbable = $tabbable[shift ? 'first' : 'last']().get(0);
    let isLeaving = (
      lastTabbable === document.activeElement ||
      get(this, 'element') === document.activeElement
    );

    if (!isLeaving) {
      return true;
    }

    event.preventDefault();
    $tabbable[shift ? 'last' : 'first']().get(0).focus();
    return false;
  },

  setupListeners() {
    document.addEventListener('click', this._clickOffCallback = (e) => {
      // If the clicked element is outside of the panel:
      if (!get(this, 'element').contains(e.target)) {
        run(this, 'handleDismiss');
        e.stopPropagation();
        e.preventDefault();
        return false;
      }

      return true;
    }, true);
  },

  teardownListeners() {
    document.removeEventListener('click', this._clickOffCallback, true);
    delete this._clickOffCallback;
  }
});
