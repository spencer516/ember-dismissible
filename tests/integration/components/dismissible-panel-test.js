import Ember from 'ember';
import { moduleForComponent, test } from 'ember-qunit';
import 'ember-dismissible/tabbable';
import sinon from 'sinon';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('dismissible-panel', 'Integration | Component | dismissible panel', {
  integration: true,
  beforeEach() {
    Ember.$(document).on('keydown', handleTab);
  },
  afterEach() {
    Ember.$(document).off('keydown', handleTab);
  }
});

test('it supports [escape] for dismissing', function(assert) {
  let spy = sinon.spy();
  this.on('dismiss', spy);

  this.render(hbs`
    {{dismissible-panel class='panel' action='dismiss'}}
  `);
  triggerKey(this.$('.panel'), 27);
  assert.ok(spy.calledOnce, 'dismiss was triggered');
});

test('focus behavior is aria compliant', function(assert) {
  this.set('showPanel', false);
  this.render(hbs`
    <input type="text" autofocus class='outer-input' />
    {{#if showPanel}}
      {{#dismissible-panel class='panel'}}
        <input type="text" class='inner-input-1' />
        <input type="text" autofocus class='inner-input-2' />
        <input type="text" class='inner-input-3' />
      {{/dismissible-panel}}
    {{/if}}
  `);

  this.$('.outer-input').get(0).focus();
  assert.equal(document.activeElement, this.$('.outer-input').get(0), 'the outer input is focused initially');

  this.set('showPanel', true);
  assert.equal(document.activeElement, this.$('.inner-input-2').get(0), 'the inner autofocus input is focused');

  triggerKey(this.$('.inner-input-2'), 9, 'keydown');
  assert.equal(document.activeElement, this.$('.inner-input-3').get(0), 'the autofocus input 3 is focused');

  triggerKey(this.$('.inner-input-3'), 9, 'keydown');
  assert.equal(document.activeElement, this.$('.inner-input-1').get(0), 'the autofocus input 1 is focused (focus was trapped)');

  triggerKey(this.$('.inner-input-1'), 9, 'keydown', { shiftKey: true });
  assert.equal(document.activeElement, this.$('.inner-input-3').get(0), 'the autofocus input 3 is focused (focus was trapped in reverse)');

  this.set('showPanel', false);
  assert.equal(document.activeElement, this.$('.outer-input').get(0), 'focus is returned to the outer input');
});

test('clicking also appropriately dismisses', function(assert) {
  let spy = sinon.spy();
  this.on('dismiss', spy);

  this.render(hbs`
    <div class="click-off"></div>
    {{#dismissible-panel class='panel' action='dismiss'}}
      <div class="click-inside"></div>
    {{/dismissible-panel}}
  `);

  this.$('.panel').click();
  assert.equal(spy.callCount, 0, 'dismiss not called');

  this.$('.click-inside').click();
  assert.equal(spy.callCount, 0, 'dismiss not called');

  this.$('.click-off').click();
  assert.equal(spy.callCount, 1, 'dismiss called');
});

test('an action is yielded to dismiss too', function(assert) {
  let spy = sinon.spy();
  this.on('dismiss', spy);

  this.render(hbs`
    {{#dismissible-panel class='panel' action='dismiss' as |dismiss|}}
      <div class="click-inside" {{action dismiss}}></div>
    {{/dismissible-panel}}
  `);

  this.$('.click-inside').click();
  assert.equal(spy.callCount, 1, 'dismiss called');
});

test('the click handler is properly removed', function(assert) {
  assert.expect(0);
  this.set('visible', true);
  this.render(hbs`
    {{#if visible}}
      {{dismissible-panel}}
    {{/if}}`);
  this.set('visible', false);
  this.$().click(); // If the click handler was not removed, this will throw an error.
});

function triggerKey($sel, keyCode, eventName = 'keyup', additionalOpts = {}) {
  let event = Ember.$.Event(eventName);
  event.keyCode = keyCode;
  Object.assign(event, additionalOpts);
  $sel.trigger(event);
}

function handleTab(e) {
  if (e.keyCode === 9) {
    let shift = e.shiftKey;
    let element = document.activeElement;
    let all = Ember.$(':tabbable').toArray();
    let idx = all.indexOf(element) + (shift ? -1 : 1);

    if (idx < 0) {
      idx = all.length - 1;
    } else if (idx > all.length - 1) {
      idx = 0;
    }

    all[idx].focus();
  }
}
