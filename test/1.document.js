/* global require, describe, before, it */
var expect = expect || require('expect.js');
var dialogo = dialogo || require('../src/main');

var Document = dialogo.Document;
describe('Document', function(){
  describe('#version', function(){
    it('starts at 0', function(){
        expect(new Document().version).to.be(0);
    });
  });
});
