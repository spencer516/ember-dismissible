import Ember from 'ember';
import unindent from '../utils/unindent';
import PARTIALS from '../utils/snippets';
const { computed } = Ember;

/* global hljs */
export default Ember.Component.extend({
  source: computed('attrs.name', function() {
    let source = (PARTIALS[this.getAttr('name')] || '')
      .replace(/^(\s*\n)*/, '')
      .replace(/\s*$/, '');
    return unindent(source);
  }),

  didInsertElement() {
    if (this.get('source')) {
      hljs.highlightBlock(this.$('pre')[0]);
    }
  }
});

