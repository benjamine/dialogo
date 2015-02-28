/*
 * mocha's bdd syntax is inspired in RSpec
 *   please read: http://betterspecs.org/
 */
require('./util/globals');
var jsondiffpatch = dialogo.jsondiffpatch;

var Doc = dialogo.Doc;

describe('Doc', function(){
  describe('#version', function(){
    it('starts at 0', function(){
        expect(new Doc().version).to.be(0);
    });
  });
  describe('#clone', function(){
    it('creates an exact copy', function(){
      var doc = new Doc({
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
      expect(Doc.empty).to.be.a(Doc);
      expect(Doc.empty.isEmpty).to.be(true);
    });
  });
});
