
var Document = require('./document').Document;

function Storage(documents) {
  // base implementation is readonly in-memory
  this.documents = documents || {};
}

Storage.prototype.get = function (url, options, callback) {
  if (!this.documents || !this.documents[url]) {
    var err = new Error('document not found');
    err.notFound = true;
    err.url = url;
    callback(err);
    return;
  }
  var doc = this.documents[url];
  if (!(doc instanceof Document)) {
    doc = this.documents[url] = new Document(doc);
  }
  doc = doc.clone();
  doc.url = url;
  callback(null, doc);
};

exports.Storage = Storage;
