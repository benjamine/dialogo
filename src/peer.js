var events = require('events');
var jsondiffpatch = require('jsondiffpatch');
var util = require('util');

var Document = require('./document').Document;

function Peer(name, document){
  events.EventEmitter.call(this);
  this.name = name;
  this.document = document || Document.empty;
  this.inbox = [];
  this.outbox = [];
  this.createShadow();
  this.watchInterval = Peer.defaults.watchInterval;
  this.debug = Peer.defaults.debug;
}
util.inherits(Peer, events.EventEmitter);

Peer.defaults = {
  watchInterval: 100,
  debug: false
};

Peer.prototype.log = function() {
  if (this.debug) {
    var args = Array.prototype.slice.apply(arguments);
    args.unshift('[Peer ' + this.name + ']');
    console.log.apply(console, args);
  }
};

Peer.prototype.use = function(doc) {
  this.log('document loaded locally:', doc.url);
  this.document = doc;
  this.createShadow();
  var req = this.documentRequest;
  if (req) {
    this.documentRequest = null;
    if (req.callback) {
      req.callback();
    }
  }
  this.watch();
};

Peer.prototype.load = function(url, options, callback) {
  var opt = options || {};
  if (typeof options === 'function') {
    callback = options;
    opt = {};
  }
  this.documentRequest = {
    url: url,
    options: opt,
    callback: callback
  };
  if (opt && opt.local) {
    this.emit('load', url, callback);
    if (!this.loading) {
      this.log('no loader for', url);
      callback(new Error('no loader'));
    }
  } else {
    this.scan();
  }
};

Peer.prototype.createShadow = function() {
  this.shadow = this.document.clone();
};

Peer.prototype.send = function(message) {
  this.emit('message', message);
  this.lastSent = message;
  this.waitingResponse = true;
};

Peer.prototype.receive = function(message) {
  var self = this;
  this.waitingResponse = false;
  this.responding = true;
  message.responseTo = this.lastSent;
  this.respond(message, function(err, response){
    if (err) {
      self.send({ error: err });
      self.responding = false;
      return;
    }
    if (response) {
      self.send(response);
    }
    self.responding = false;
  });
};

Peer.prototype.isBusy = function () {
  return this.waitingResponse || this.responding;
};

Peer.prototype.scan = function(){
  var self = this;
  if (this.responding) {
    return;
  }
  if (!this.waitingResponse && this.documentRequest) {
    if (!this.documentRequest.options.local && !this.documentRequest.sent) {
      this.log('requesting document', this.documentRequest.url);
      this.send({
        load: true,
        url: this.documentRequest.url,
        options: this.documentRequest.options
      });
      this.documentRequest.sent = true;
    }
    return;
  }

  this.getChanges(function(delta) {
    if (!delta) {
      return;
    }
    self.stop();
    if (self.isBusy()) {
      self.log('ping');
      self.send({ ping: true });
      return;
    }
    self.document.version++;
    self.createShadow();
    self.send({
      delta: delta,
      version: self.document.version
    });
  });
};

Peer.prototype.watch = function (start) {
  if (this.watchTimer) {
    return;
  }
  var self = this;
  this.watchTimer = setInterval(function(){
    /*
    if (!self.syncComplete) {
      self.stop();
      return;
    }
    */
    if (self.isPaused) {
      return;
    }
    self.scan({ source: 'watch' });
  }, Math.max(20, self.watchInterval));
  this.log('watching...');
};

Peer.prototype.stop = function () {
  if (!this.watchTimer) {
    return;
  }
  clearInterval(this.watchTimer);
  this.watchTimer = null;
  this.log('watch stopped');
};

Peer.prototype.pause = function () {
  if (this.isPaused) {
    return;
  }
  this.isPaused = true;
  this.emit('pause');
};

Peer.prototype.resume = function () {
  if (!this.isPaused) {
    return;
  }
  this.isPaused = false;
  this.emit('resume');
};

Peer.prototype.getChanges = function (callback) {
  // use jsondiffpatch to detect changes in document
  var delta = jsondiffpatch.diff(this.shadow.root, this.document.root);
  if (delta) {
    this.log('found changes', delta);
  }
  callback(delta);
};

Peer.prototype.respond = function(message, callback) {
  var self = this;
  var sendNoop = function(){
    callback(null, { noop: true });
  };

  // respond to a delta
  if (message.delta) {
    this.log('patching...');
    // exact patch
    jsondiffpatch.patch(this.shadow.root, message.delta);
    // best-effort patch
    jsondiffpatch.patch(this.document.root, message.delta);
    if (message.version && this.document.version <= message.version) {
      this.document.version = message.version;
    } else {
      this.document.version++;
    }
    this.log('result:', this.document);
  }

  // respond to noop (peer has no changes)
  if (message.noop) {
    this.log('got noop');
    // no changes on the other peer
    if ((message.responseTo && message.responseTo.noop) && !this.alwaysRespondNoops) {
      // sync complete
      this.log('sync complete');
      this.emit('sync');
      this.watch();
      callback();
      return;
    }
  }

  // respond to ping (peer wants to send a message, but is waiting for response)
  if (message.ping) {
    this.log('got ping');
    if (this.waitingResponse) {
      this.log('ignoring ping, waiting a response');
      callback();
      return;
    }
  }

  // respond to this messages sending changes (if any)
  if (message.noop || message.delta || message.ping) {
    this.getChanges(function(delta) {
      if (!delta) {
        if (message.noop) {
          self.log('sync complete');
          self.emit('sync');
          self.watch();
        }
        sendNoop();
        return;
      }
      self.document.version++;
      self.createShadow();
      callback(null, {
        delta: delta,
        version: self.document.version
      });
    });
    return;
  }

  // respond to document load request
  if (message.load) {
    // peer wants to load a full document
    this.log('got document load request');
    var url = message.url;
    var sendDocument = function(){
      var doc = self.document.clone();
      self.watch();
      callback(null, {
        document: {
          root: doc.root,
          url: doc.url,
          version: doc.version
        }
      });
    };
    if (this.document.isEmpty || (url && this.document.url !== url)) {
      this.log('loading', url);
      this.load(url, { local: true }, function(err) {
        if (err) {
          self.log('error loading document');
          callback(null, {
            error: err.message,
            name: name
          });
          return;
        }
        self.log('document loaded, sending to peer', self.document);
        sendDocument();
        return;
      });
      return;
    }
    this.log('sending document', this.document);
    sendDocument();
    return;
  }

  // respond to full document
  if (message.document) {
    // peer sent the full document
    var req = this.documentRequest;
    if (req && req.sent) {
      this.documentRequest = null;
    }
    if (message.error) {
      this.log('document load error');
      callback();
      return;
    }
    this.document = new Document(message.document.root, message.document.version);
    this.document.url = message.document.url;
    this.createShadow();
    this.log('got document', this.document);
    this.watch();
    callback();
    if (req && req.callback) {
      req.callback();
    }
    return;
  }

  // respond to unexpected message
  this.log('error', 'unexpected message', message);
  callback(new Error('unexpected message'));
};

Peer.prototype.bindTo = function (peer, options) {
  var self = this;
  if (peer instanceof Peer) {
    // bind directly to another Peer
    var artificialDelay = Math.max(options && options.artificialDelay, 1);
    peer.on('message', function(message) {
      setTimeout(function(){
        self.receive(message);
      }, artificialDelay);
    });
    this.boundTo = peer;
    if (!peer.boundTo) {
      peer.bindTo(self);
    }
    return;
  }
  throw new Error('unsupported bind target');
};

exports.Peer = Peer;
