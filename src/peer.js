var events = require('events');
var jsondiffpatch = require('jsondiffpatch');
var util = require('util');

var Doc = require('./doc').Doc;

function Peer(name, document){
  events.EventEmitter.call(this);
  if (name instanceof Doc) {
    this.document = name;
  } else {
    this.name = name;
    this.document = document || Doc.empty;
  }
  this.counters = {
    messages: {
      sent: 0,
      received: 0
    }
  };
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

Peer.prototype.syncBroken = function () {
  if (!this.synchronized) {
    return;
  }
  this.synchronized = false;
  this.emit('unsync');
  this.stop();
};

Peer.prototype.syncComplete = function () {
  if (this.synchronized) {
    return;
  }
  this.synchronized = true;
  this.log('sync complete');
  this.emit('sync');
  this.watch();
};

Peer.prototype.use = function(doc) {
  this.log('document loaded locally:', doc.url);
  this.document = doc;
  this.createShadow();
  this.emit('loaded');
  var req = this.documentRequest;
  if (req) {
    this.documentRequest = null;
    if (req.callback) {
      req.callback();
    }
  }
  this.syncComplete();
};

Peer.prototype.load = function(url, options, callback) {
  var opt = options || {};
  var self = this;
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
      if (this.storage) {
        this.loading = true;
        this.storage.get(url, opt, function(err, doc) {
          self.loading = false;
          if (err) {
            callback(err);
            return;
          }
          self.use(doc);
        });
        return;
      }
      this.log('no document loader for', url);
      callback(new Error('no document loader'));
    }
  } else {
    this.scan();
  }
};

Peer.prototype.save = function(url, options, callback) {
  var opt = options || {};
  var self = this;
  if (typeof options === 'function') {
    callback = options;
    opt = {};
  }
  this.saveRequest = {
    url: url,
    options: opt,
    callback: callback
  };
  this.emit('save', url, callback);
  if (!this.saving) {
    if (this.storage) {
      this.saving = true;
      this.storage.put(url, this.document, options, function(err, url) {
        self.saving = false;
        if (err) {
          callback(err);
          return;
        }
        self.document.url = url;
        self.saved();
      });
      return;
    }
    this.log('no document saver for', url);
    callback(new Error('no document saver'));
  }
};

Peer.prototype.saved = function() {
  var doc = this.document;
  this.log('document saved locally:', doc.url);
  var req = this.saveRequest;
  if (req) {
    this.saveRequest = null;
    if (req.callback) {
      req.callback();
    }
  }
};

Peer.prototype.createShadow = function() {
  this.shadow = this.document.clone();
};

Peer.prototype.send = function(message) {
  this.counters.messages.sent++;
  this.emit('message', message);
  this.lastSent = message;
  this.waitingResponse = true;
};

Peer.prototype.receive = function(message) {
  var self = this;
  this.waitingResponse = false;
  this.responding = true;
  this.counters.messages.received++;
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

  if (!this.waitingResponse && this.saveRequest) {
    if (!this.saveRequest.options.local && !this.saveRequest.sent) {
      this.log('requesting to save document as', this.saveRequest.url);
      this.send({
        save: true,
        url: this.saveRequest.url,
        options: this.saveRequest.options
      });
      this.saveRequest.sent = true;
    }
    return;
  }

  this.getChanges(function(delta) {
    if (!delta) {
      return;
    }
    self.syncBroken();
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

Peer.prototype.watch = function () {
  if (this.watchTimer) {
    return;
  }
  var self = this;
  this.watchTimer = setInterval(function(){
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
  this.peerError = null;
  var self = this;
  var sendNoop = function(){
    callback(null, { noop: true });
  };

  var req;

  // respond to peer error
  if (message.error) {
    this.log('got peer error: ' + message.error);
    this.peerError = message.error;
    callback();
    return;
  }

  // respond to a delta
  if (message.delta) {
    this.log('patching...');
    try {
      // exact patch
      this.shadow.root = jsondiffpatch.patch(this.shadow.root, message.delta);
    } catch (err) {
      // out-of-sync TODO: reload the full doc
      this.log('patch error: ', err);
    }
    try {
      // best-effort patch
      this.document.root = jsondiffpatch.patch(this.document.root, message.delta);
    } catch (err) {
      this.log('patch error (best-effort): ', err);
    }
    if (message.version && this.document.version <= message.version) {
      this.document.version = message.version;
    } else {
      this.document.version++;
    }
    this.log('result:', this.document);
    this.emit('change');
  }

  // respond to noop (peer has no changes)
  if (message.noop) {
    this.log('got noop');
    // no changes on the other peer
    if ((message.responseTo && message.responseTo.noop) && !this.alwaysRespondNoops) {
      this.syncComplete();
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
  if (message.noop || message.delta || message.ping || message.saved) {
    this.getChanges(function(delta) {
      if (!delta) {
        if (message.noop) {
          self.syncComplete();
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
    var sendDoc = function(){
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
      var loadOptions = message.options || {};
      loadOptions.local = true;
      this.load(url, loadOptions, function(err) {
        if (err) {
          self.log('error loading document');
          callback(null, {
            error: err.message,
            url: url
          });
          return;
        }
        self.log('document loaded, sending to peer', self.document);
        sendDoc();
        return;
      });
      return;
    }
    this.log('sending document', this.document);
    sendDoc();
    return;
  }

  // respond to full document
  if (message.document) {
    // peer sent the full document
    req = this.documentRequest;
    if (req && req.sent) {
      this.documentRequest = null;
    }
    if (message.error) {
      this.log('document load error');
      callback();
      return;
    }
    this.document = new Doc(message.document.root, message.document.version);
    this.document.url = message.document.url;
    this.createShadow();
    this.log('got document', this.document);
    this.emit('loaded');
    this.syncComplete();
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
  if (peer && typeof peer.on === 'function') {
    var artificialDelay = Math.max(options && options.artificialDelay, 1);
    peer.on('message', function(message) {
      setTimeout(function(){
        self.receive(message);
      }, artificialDelay);
    });
    this.boundTo = peer;
    if (peer instanceof Peer && !peer.boundTo) {
      peer.bindTo(self, options);
    }
    return;
  }
  throw new Error('unsupported bind target');
};

exports.Peer = Peer;
