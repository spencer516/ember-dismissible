var Plugin = require('broccoli-plugin');
var path = require('path');
var fs = require('fs');
var walkSync = require('walk-sync');
var mkdirp = require('mkdirp');
var visit = require('./visit-ast');

FindCodeSnippets.prototype = Object.create(Plugin.prototype);
FindCodeSnippets.prototype.constructor = FindCodeSnippets;

function extractSnippets(fileContents, opts) {
  var snippets = {}
  opts = naiveMerge({
    component: 'component-usage',
    paramProp: 'template'
  }, opts);

  fileContents = fileContents || '';

  var insideContainer = false;
  var insideTemplate = false;
  var blockParam = '';
  var activeTitle = '';
  var extractor = contentExtractor(fileContents);
  var getNextStart = false;
  var nodeEnd = null;
  var nodeStart = null;

  visit(fileContents, function(node) {
    if (node.type === 'BlockStatement' && node.path.original === opts.component) {
      var title = node.hash.pairs.find(function(pair) {
        return pair.key === 'title';
      });

      // Only support string literal types for the title
      if (title.value.type === 'StringLiteral') {
        insideContainer = true;
        activeTitle = title.value.value;
      }

      if (node.program.blockParams) {
        blockParam = node.program.blockParams[0];
      }
    }

    if (insideContainer && node.type === 'BlockStatement' && node.path.original === blockParam + '.' + opts.paramProp) {
      insideTemplate = true;
    } else if (insideTemplate && node.type === 'Program') {
      // We've found a snippet.
      nodeEnd = node.loc.end;
      nodeStart = node.loc.start;
      getNextStart = true;
    } else if (getNextStart) {
      if (node.type !== 'TextNode') {
        var extracted = extractor(nodeStart, nodeEnd);
        var removeTag = new RegExp('\\{\\{#'+ blockParam + '\\.' + opts.paramProp + '([^\\}])*\\}\\}\\n?');
        extracted = extracted.replace(removeTag, '');
        snippets[activeTitle] = extracted;

        // Reset the state
        insideContainer = false;
        insideTemplate = false;
        blockParam = '';
        activeTitle = '';
        getNextStart = true;
        getNextStart = false;
        nodeEnd = null;
      }
    }
  });

  return snippets;
}

function naiveMerge(obj1, obj2){
  var obj3 = {};
  var prop;
  for (prop in obj1) { obj3[prop] = obj1[prop]; }
  for (prop in obj2) { obj3[prop] = obj2[prop]; }
  return obj3;
}

function FindCodeSnippets(inputNodes, options) {
  if (!(this instanceof FindCodeSnippets)) {
    return new FindCodeSnippets(inputNodes, options);
  }
  options = options || {};
  Plugin.call(this, inputNodes, {
    annotation: options.annotation
  });
  this.options = options;
}

FindCodeSnippets.prototype.build = function() {
  var output = {};
  this.inputPaths.forEach(function(inputPath) {
    var entries = walkSync(inputPath, { directories: false, globs: ['**/*.hbs'] });

    entries.forEach(function(file) {
      var fullPath = path.join(inputPath, file);
      var newOutput = extractSnippets(fs.readFileSync(fullPath, 'utf-8'));
      output = naiveMerge(output, newOutput);
    });
  });

  // Make the directories as necessary.
  var outputFile = path.join(this.outputPath, this.options.outputFile);
  mkdirp.sync(path.dirname(outputFile));

  fs.writeFileSync(outputFile, modularize(output));
}

function modularize(data) {
  var parts = [];
  parts.push("define('dummy/utils/snippets', ['exports'], function(exports) {");
  parts.push("exports['default'] = ");
  parts.push(JSON.stringify(data));
  parts.push("; });");
  return parts.join('');
}

module.exports = FindCodeSnippets;
module.exports.extractSnippets = extractSnippets;

function contentExtractor(fileContents) {
  var lines = fileContents.split('\n');
  return function(start, end) {
    return lines.slice(start.line - 1, end.line).map(function(line, index, lines) {
      var slice = [0];
      var shouldSlice = false;

      if (index === 0) {
        shouldSlice = true;
        slice[0] = start.column;
      }

      if (index === lines.length - 1) {
        shouldSlice = true;
        slice.push(end.column);
      }

      return shouldSlice ? line.slice.apply(line, slice) : line;
    }).join('\n');
  }
}
