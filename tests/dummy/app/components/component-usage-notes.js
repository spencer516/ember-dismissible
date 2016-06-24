import Ember from 'ember';
import unindent from '../utils/unindent';
const { $: e$ } = Ember;

/* global Remarkable */
/* global hljs */
const md = new Remarkable({
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value;
      } catch (err) {}
    }

    try {
      return hljs.highlightAuto(str).value;
    } catch (err) {}

    return '';
  }
});

export default Ember.Component.extend({
  didInsertElement() {
    let text = unindent(this.$('.hidden-md-text').text());
    let nodes = e$(md.render(text));

    // Add the hljs class to all pre elements
    nodes.filter('pre').addClass('hljs');

    // And, insert them into the dom.
    this.$('.markdown-body').append(nodes);
  }
});
