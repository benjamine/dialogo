/*
 * mocha's bdd syntax is inspired in RSpec
 *   please read: http://betterspecs.org/
 */
require('./util/globals');
var jsondiffpatch = dialogo.jsondiffpatch;

var testutil = require('./testutil');
expect.Assertion.prototype.deepEqual = testutil.assertionDeepEqual;
var forEach = testutil.forEach;

var Peer = dialogo.Peer;
var Doc = dialogo.Doc;
var Storage = dialogo.Storage;

Peer.defaults.debug = process.env.PEERLOG;

function onSyncComplete(peers, callback) {
  var done = false;

  var onPeerSync = function(peer){
    if (peer.testSpec.ignoreSyncs) {
      peer.testSpec.ignoreSyncs--;
      return;
    }
    peer.removeListener('sync', onPeerSync);
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
      forEach(peers, function(peer2) {
        // stop watching, test is over
        peer2.stop();
      });
      callback(null, stats);
    }
  };

  forEach(peers, function(peer) {
    peer.on('sync', function(){
      onPeerSync(peer);
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
              var peerDoc = peerSpec.doc ? new Doc(peerSpec.doc.root, peerSpec.doc.version) : null;
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
                var url, options;

                // peers with initial load
                if (peer.testSpec.load) {
                  url = peer.testSpec.load;
                  options = {};
                  if (typeof url !== 'string') {
                    options = url.options;
                    url = url.url;
                  }
                  peer.load(url, options);
                }

                // make changes to peer documents
                if (peer.testSpec.patch) {
                  if (peer.testSpec.load) {
                    // patch after load is complete
                    peer.testSpec.ignoreSyncs = (peer.testSpec.ignoreSyncs || 0) + 1;
                    peer.once('loaded', function(){
                      peer.document.root = jsondiffpatch.patch(peer.document.root, peer.testSpec.patch);
                      peer.scan();
                    });
                  } else {
                    peer.document.root = jsondiffpatch.patch(peer.document.root, peer.testSpec.patch);
                    peer.scan();
                  }
                }

              });

            });
          }

        });
      });
    });
  });
});
