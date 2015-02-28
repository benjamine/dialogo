
var Doc = require('./doc').Doc;

function Storage(documents) {
  // base implementation is in-memory
  this.documents = documents || {};
}

Storage.prototype.get = function (url, options, callback) {
  if (!this.documents || !this.documents[url]) {
    if (!options || !options.create) {
      var err = new Error('document not found');
      err.notFound = true;
      err.url = url;
      callback(err);
      return;
    }
    this.documents[url] = {};
  }
  var doc = this.documents[url];
  if (!(doc instanceof Doc)) {
    doc = this.documents[url] = new Doc(doc);
  }
  doc.url = url;
  callback(null, doc);
};

Storage.prototype.put = function (url, doc, options, callback) {
  if (!this.documents) {
    this.documents = {};
  }
  if (!(doc instanceof Doc)) {
    doc = new Doc(doc);
  }
  doc.url = url;
  this.documents[url] = doc.clone();
  callback(null, url);
};

exports.Storage = Storage;
