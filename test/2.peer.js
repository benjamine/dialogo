/* global require, describe, before, it */
var expect = expect || require('expect.js');
var dialogo = dialogo || require('../src/main');
var jsondiffpatch = jsondiffpatch || require('jsondiffpatch');

var Peer = dialogo.Peer;
var Document = dialogo.Document;

describe('Peer', function(){
  describe('#document', function(){
    it('is a Document', function(){
      var peer = new Peer();
      expect(peer.document).to.be.a(Document);
    });
    it('is empty by default', function(){
      var peer = new Peer();
      expect(peer.document).to.be(Document.empty);
    });
    it('can be set on constructor', function(){
      var doc = new Document();
      var peer = new Peer(doc);
      expect(peer.document).to.be(doc);
    });
  });
  describe('#createShadow', function(){
    it('clones document into #shadow', function(){
      var doc = new Document({ a: 1, b: 'two', c: [1, 2, 3]});
      var peer = new Peer(doc);
      peer.createShadow();
      expect(jsondiffpatch.diff(peer.document.root, peer.shadow.root)).to.be(undefined);
    });
  });
});
