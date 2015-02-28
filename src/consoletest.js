
var Doc = require('./doc').Doc;
var Peer = require('./peer').Peer;

exports.Doc = Doc;
exports.Peer = Peer;

var docs = {
  example1: new Doc({
    firstname: 'Django',
    lastname: 'Reinhardt'
  })
};

Peer.defaults.debug = true;

var peer1 = new Peer('one');
var peer2 = new Peer('two');

peer2.bindTo(peer1, {
  artificialDelay: 500
});

peer1.on('load', function(url) {
  peer1.loading = true;
  setTimeout(function(){
    var doc = docs[url].clone();
    doc.url = url;
    peer1.use(doc);
  }, 2000);
});

peer2.load('example1', function(err){

  if (err) {
    console.log('error loading doc');
    return;
  }
  console.log('load complete');
  setTimeout(function(){

    console.log('touching doc 1');
    peer1.document.root.genre = 'Jazz';
    console.log('touching doc 2');
    peer2.document.root.genre = 'Gypsy Jazz';
    peer2.document.root.nationality = 'French';

    setTimeout(function(){
      //peer2.document.root.genre = 'Bebop';
      console.log('touching doc 1');
      peer1.document.root.nationality = 'Belgian';

      setTimeout(function(){
        //peer2.document.root.genre = 'Bebop';
        console.log('touching doc 2');
        peer2.document.root.nationality = 'Austrian';
      }, 4000);

    }, 8000);

  }, 4000);

});
