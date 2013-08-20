/* global require, describe, before, it */
var expect = expect || require('expect.js');
var dialogo = dialogo || require('../src/dialogo');
var Dialogo = dialogo.Dialogo;

describe('Dialogo', function(){
    'use strict';

    describe('#documents', function(){
        it('starts empty', function(){
            expect(new Dialogo().documents).to.be.empty();
        });
    });

});