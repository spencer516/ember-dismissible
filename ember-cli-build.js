/*jshint node:true*/
/* global require, module */
var EmberAddon = require('ember-cli/lib/broccoli/ember-addon');
var FindCodeSnippets = require('./lib/find-code-snippets');
var BroccoliMergeTrees = require('broccoli-merge-trees');

module.exports = function(defaults) {
  var app = new EmberAddon(defaults, {});

  app.import('bower_components/highlightjs/highlight.pack.min.js');
  app.import('bower_components/remarkable/dist/remarkable.min.js');

  var snippets = new FindCodeSnippets(['tests/dummy/app'], {
    outputFile: 'dummy/snippets.js'
  });

  // Merge the snippets into the app tree. (is there a better way to do this?)
  app._appAndDependencies = app.appAndDependencies;
  app.appAndDependencies = function() {
    return new BroccoliMergeTrees([app._appAndDependencies(), snippets]);
  };

  return app.toTree();
};
