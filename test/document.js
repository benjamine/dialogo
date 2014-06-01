/* global require, describe, it */
var expect = (typeof window !== 'undefined' && window.expect) ? window.expect : require('expect.js');
var dialogo = (typeof window !== 'undefined') ? window.dialogo : require('../src/' + 'main.js');
var jsondiffpatch = dialogo.jsondiffpatch;

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
            inner: { d: 44, e: 'text', f: new Date() }
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
