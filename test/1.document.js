/* global require, describe, before, it */
var expect = expect || require('expect.js');
var dialogo = dialogo || require('../src/main');
var jsondiffpatch = jsondiffpatch || require('jsondiffpatch');

var Document = dialogo.Document;

describe('Document', function(){
  describe('#version', function(){
    it('starts at 0', function(){
        expect(new Document().version).to.be(0);
    });
  });
  describe('#clone', function(){
    it('creates an exact copy', function(){
      var doc = new Document({
        a: 1,
        b: [3, 4, true],
        c: {
            inner: { d: 44, e: "text", f: new Date() }
        }
      });
      var clone = doc.clone();
      var delta = jsondiffpatch.diff(doc.root, clone.root);
      expect(doc.version).to.be(clone.version);
      expect(delta).to.be(undefined);
    });
  });
  describe('.empty', function(){
    it('is an empty document', function(){
      expect(Document.empty).to.be.a(Document);
      expect(Document.empty.isEmpty).to.be(true);
    });
  });
});
