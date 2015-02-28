/*
 * mocha's bdd syntax is inspired in RSpec
 *   please read: http://betterspecs.org/
 */
require('./util/globals');
var jsondiffpatch = dialogo.jsondiffpatch;

var Peer = dialogo.Peer;
var Doc = dialogo.Doc;

describe('Peer', function(){
  describe('#document', function(){
    it('is a Doc', function(){
      var peer = new Peer();
      expect(peer.document).to.be.a(Doc);
    });
    it('is empty by default', function(){
      var peer = new Peer();
      expect(peer.document).to.be(Doc.empty);
    });
    it('can be set on constructor', function(){
      var doc = new Doc();
      var peer = new Peer(doc);
      expect(peer.document).to.be(doc);
    });
  });
  describe('#createShadow', function(){
    it('clones document into #shadow', function(){
      var doc = new Doc({ a: 1, b: 'two', c: [1, 2, 3]});
      var peer = new Peer(doc);
      peer.createShadow();
      expect(jsondiffpatch.diff(peer.document.root, peer.shadow.root)).to.be(undefined);
    });
  });
});
