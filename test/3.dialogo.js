/* global require, describe, before, it */
var expect = expect || require('expect.js');
var dialogo = dialogo || require('../src/main');
var jsondiffpatch = jsondiffpatch || require('jsondiffpatch');
var testutil = require('./testutil');
expect.Assertion.prototype.deepEqual = testutil.assertionDeepEqual;
var arrayForEach = testutil.arrayForEach;
var forEach = testutil.forEach;
var objectKeys = testutil.objectKeys;

var Peer = dialogo.Peer;
var Document = dialogo.Document;
var Storage = dialogo.Storage;

Peer.defaults.debug = process.env.PEERLOG;

function onSyncComplete(peers, callback) {
  var done = false;
  forEach(peers, function(peer) {
    peer.once('sync', function(){
      if (done) {
        return;
      }
      var allSync = true;
      var stats = {
        sent: {
          total: 0,
          max: 0
        }
      };
      forEach(peers, function(peer2) {
        if (!peer2.synchronized) {
          allSync = false;
          return;
        }
        var peerSent = peer2.counters.messages.sent;
        stats.sent.total += peerSent;
        stats.sent.max = Math.max(stats.sent.max, peerSent);
      });
      if (allSync) {
        done = true;
        callback(null, stats);
      }
    });
  });
}

describe('dialogo', function(){
  var examples = require('./examples/dialogos');

  forEach(examples, function(group, groupName){
    describe(groupName, function(){
      forEach(group, function(example, exampleIndex){
        if (!example) { return; }

        var name = example.name || 'example ' + exampleIndex;
        describe(name, function(){
          before(function(){

            // create all peers
            var peers = this.peers = {};
            var hubPeer;
            forEach(example.peers, function(peerSpec, peerName) {
              var peerDoc = peerSpec.doc ? new Document(peerSpec.doc.root, peerSpec.doc.version) : null;
              var peer = new Peer(peerName, peerDoc);
              peers[peerName] = peer;
              peer.testSpec = peerSpec;
              if (peerSpec.hub) {
                hubPeer = peer;
              }
              if (peerSpec.storage) {
                peer.storage = new Storage(peerSpec.storage);
              }
            });
            this.hubPeer = hubPeer;
          });


          if (example.result) {
            it('should sync in time', function(done) {
              var peers = this.peers;
              var hubPeer = this.hubPeer;

              onSyncComplete(peers, function(err, stats) {
                if (err) {
                  done(err);
                }
                var expectedStats = example.result.stats;

                if (expectedStats) {
                  var messageStats = expectedStats.messages;
                  if (messageStats) {
                    // control message sent stats
                    if (messageStats.sent) {
                      if (typeof messageStats.sent.max !== 'undefined') {
                        expect(stats.sent.max).to.be(messageStats.sent.max);
                      }
                      if (typeof messageStats.sent.total !== 'undefined') {
                        expect(stats.sent.total).to.be(messageStats.sent.total);
                      }
                    }
                  }
                }

                // control resulting document on each peer
                if (example.result.alldocs) {
                  var expectedDoc = example.result.alldocs;
                  forEach(peers, function(peer) {
                    if (typeof expectedDoc.root !== 'undefined') {
                      expect(peer.document.root).to.be.deepEqual(expectedDoc.root);
                    }
                  });
                }

                done();
              });

              if (hubPeer) {
                // bind all peers to the hub peer
                forEach(peers, function(peer){
                  if (peer !== hubPeer) {
                    peer.bindTo(hubPeer);
                  }
                });
              }

              forEach(peers, function(peer){

                // peers with initial load
                if (peer.testSpec.load) {
                  var url = peer.testSpec.load, options = {};
                  if (typeof url !== 'string') {
                    url = url.url;
                    options = url.options;
                  }
                  peer.load(url, options);
                }

                // make changes to peer documents
                if (peer.testSpec.patch) {
                  jsondiffpatch.patch(peer.document.root, peer.testSpec.patch);
                  peer.scan();
                }

              });

            });
          }

        });
      });
    });
  });
});
