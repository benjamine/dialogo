var jsondiffpatch = require('jsondiffpatch');

function Doc(root, version) {
  this.root = typeof root === 'undefined' ? null : root;
  this.version = version || 0;
}

Doc.prototype.clone = function () {
  var doc = new Doc(
    JSON.parse(JSON.stringify(this.root), jsondiffpatch.dateReviver),
    this.version
  );
  doc.url = this.url;
  return doc;
};

Doc.empty = new Doc(null, 0);
Doc.empty.isEmpty = true;

Doc.notFound = new Doc(null, 0);
Doc.notFound.notFound = true;

exports.Doc = Doc;
