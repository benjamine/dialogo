var jsondiffpatch = require('jsondiffpatch');

function Document(root, version) {
  this.root = typeof root == 'undefined' ? null : root;
  this.version = version || 0;
}

Document.prototype.clone = function () {
  var doc = new Document(
    JSON.parse(JSON.stringify(this.root), jsondiffpatch.dateReviver),
    this.version
  );
  doc.url = this.url;
  return doc;
};

Document.empty = new Document(null, 0);
Document.empty.isEmpty = true;

Document.notFound = new Document(null, 0);
Document.notFound.notFound = true;

exports.Document = Document;
