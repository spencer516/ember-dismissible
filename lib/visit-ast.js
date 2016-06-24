var compile = require('htmlbars').compile;

function Plugin(cb) {
  this.options = {};
  this.syntax = null;
  this.cb = cb;
}

Plugin.prototype.transform = function(ast) {
  var walker = new this.syntax.Walker();
  var cb = this.cb;
  walker.visit(ast, function(node) {
    cb(node);
  });

  return ast;
};

function visit(fileContents, cb) {
  compile(fileContents, {
    plugins: {
      moduleName: 'does-not-matter',
      ast: [function() {
        return new Plugin(cb);
      }]
    }
  });
}

module.exports = visit;
