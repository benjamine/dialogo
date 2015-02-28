!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.dialogo=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process){

var Doc = require('./doc').Doc;
var Peer = require('./peer').Peer;
var Storage = require('./storage').Storage;

exports.Doc = Doc;
exports.Peer = Peer;
exports.Storage = Storage;
exports.jsondiffpatch = require('jsondiffpatch');

var inNode = typeof process !== 'undefined' && typeof process.execPath === 'string';
if (!inNode) {
	exports.homepage = 'https://github.com/benjamine/dialogo';
	exports.version = '0.0.2';
}

}).call(this,require('_process'))

},{"./doc":24,"./peer":25,"./storage":26,"_process":4,"jsondiffpatch":21}],2:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],3:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],4:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],5:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],6:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":5,"_process":4,"inherits":3}],7:[function(require,module,exports){
/**
 * Diff Match and Patch
 *
 * Copyright 2006 Google Inc.
 * http://code.google.com/p/google-diff-match-patch/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Computes the difference between two texts to create a patch.
 * Applies the patch onto another text, allowing for errors.
 * @author fraser@google.com (Neil Fraser)
 */

/**
 * Class containing the diff, match and patch methods.
 * @constructor
 */
function diff_match_patch() {

  // Defaults.
  // Redefine these in your program to override the defaults.

  // Number of seconds to map a diff before giving up (0 for infinity).
  this.Diff_Timeout = 1.0;
  // Cost of an empty edit operation in terms of edit characters.
  this.Diff_EditCost = 4;
  // At what point is no match declared (0.0 = perfection, 1.0 = very loose).
  this.Match_Threshold = 0.5;
  // How far to search for a match (0 = exact location, 1000+ = broad match).
  // A match this many characters away from the expected location will add
  // 1.0 to the score (0.0 is a perfect match).
  this.Match_Distance = 1000;
  // When deleting a large block of text (over ~64 characters), how close does
  // the contents have to match the expected contents. (0.0 = perfection,
  // 1.0 = very loose).  Note that Match_Threshold controls how closely the
  // end points of a delete need to match.
  this.Patch_DeleteThreshold = 0.5;
  // Chunk size for context length.
  this.Patch_Margin = 4;

  // The number of bits in an int.
  this.Match_MaxBits = 32;
}


//  DIFF FUNCTIONS


/**
 * The data structure representing a diff is an array of tuples:
 * [[DIFF_DELETE, 'Hello'], [DIFF_INSERT, 'Goodbye'], [DIFF_EQUAL, ' world.']]
 * which means: delete 'Hello', add 'Goodbye' and keep ' world.'
 */
var DIFF_DELETE = -1;
var DIFF_INSERT = 1;
var DIFF_EQUAL = 0;

/** @typedef {!Array.<number|string>} */
diff_match_patch.Diff;


/**
 * Find the differences between two texts.  Simplifies the problem by stripping
 * any common prefix or suffix off the texts before diffing.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {boolean=} opt_checklines Optional speedup flag. If present and false,
 *     then don't run a line-level diff first to identify the changed areas.
 *     Defaults to true, which does a faster, slightly less optimal diff.
 * @param {number} opt_deadline Optional time when the diff should be complete
 *     by.  Used internally for recursive calls.  Users should set DiffTimeout
 *     instead.
 * @return {!Array.<!diff_match_patch.Diff>} Array of diff tuples.
 */
diff_match_patch.prototype.diff_main = function(text1, text2, opt_checklines,
    opt_deadline) {
  // Set a deadline by which time the diff must be complete.
  if (typeof opt_deadline == 'undefined') {
    if (this.Diff_Timeout <= 0) {
      opt_deadline = Number.MAX_VALUE;
    } else {
      opt_deadline = (new Date).getTime() + this.Diff_Timeout * 1000;
    }
  }
  var deadline = opt_deadline;

  // Check for null inputs.
  if (text1 == null || text2 == null) {
    throw new Error('Null input. (diff_main)');
  }

  // Check for equality (speedup).
  if (text1 == text2) {
    if (text1) {
      return [[DIFF_EQUAL, text1]];
    }
    return [];
  }

  if (typeof opt_checklines == 'undefined') {
    opt_checklines = true;
  }
  var checklines = opt_checklines;

  // Trim off common prefix (speedup).
  var commonlength = this.diff_commonPrefix(text1, text2);
  var commonprefix = text1.substring(0, commonlength);
  text1 = text1.substring(commonlength);
  text2 = text2.substring(commonlength);

  // Trim off common suffix (speedup).
  commonlength = this.diff_commonSuffix(text1, text2);
  var commonsuffix = text1.substring(text1.length - commonlength);
  text1 = text1.substring(0, text1.length - commonlength);
  text2 = text2.substring(0, text2.length - commonlength);

  // Compute the diff on the middle block.
  var diffs = this.diff_compute_(text1, text2, checklines, deadline);

  // Restore the prefix and suffix.
  if (commonprefix) {
    diffs.unshift([DIFF_EQUAL, commonprefix]);
  }
  if (commonsuffix) {
    diffs.push([DIFF_EQUAL, commonsuffix]);
  }
  this.diff_cleanupMerge(diffs);
  return diffs;
};


/**
 * Find the differences between two texts.  Assumes that the texts do not
 * have any common prefix or suffix.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {boolean} checklines Speedup flag.  If false, then don't run a
 *     line-level diff first to identify the changed areas.
 *     If true, then run a faster, slightly less optimal diff.
 * @param {number} deadline Time when the diff should be complete by.
 * @return {!Array.<!diff_match_patch.Diff>} Array of diff tuples.
 * @private
 */
diff_match_patch.prototype.diff_compute_ = function(text1, text2, checklines,
    deadline) {
  var diffs;

  if (!text1) {
    // Just add some text (speedup).
    return [[DIFF_INSERT, text2]];
  }

  if (!text2) {
    // Just delete some text (speedup).
    return [[DIFF_DELETE, text1]];
  }

  var longtext = text1.length > text2.length ? text1 : text2;
  var shorttext = text1.length > text2.length ? text2 : text1;
  var i = longtext.indexOf(shorttext);
  if (i != -1) {
    // Shorter text is inside the longer text (speedup).
    diffs = [[DIFF_INSERT, longtext.substring(0, i)],
             [DIFF_EQUAL, shorttext],
             [DIFF_INSERT, longtext.substring(i + shorttext.length)]];
    // Swap insertions for deletions if diff is reversed.
    if (text1.length > text2.length) {
      diffs[0][0] = diffs[2][0] = DIFF_DELETE;
    }
    return diffs;
  }

  if (shorttext.length == 1) {
    // Single character string.
    // After the previous speedup, the character can't be an equality.
    return [[DIFF_DELETE, text1], [DIFF_INSERT, text2]];
  }
  longtext = shorttext = null;  // Garbage collect.

  // Check to see if the problem can be split in two.
  var hm = this.diff_halfMatch_(text1, text2);
  if (hm) {
    // A half-match was found, sort out the return data.
    var text1_a = hm[0];
    var text1_b = hm[1];
    var text2_a = hm[2];
    var text2_b = hm[3];
    var mid_common = hm[4];
    // Send both pairs off for separate processing.
    var diffs_a = this.diff_main(text1_a, text2_a, checklines, deadline);
    var diffs_b = this.diff_main(text1_b, text2_b, checklines, deadline);
    // Merge the results.
    return diffs_a.concat([[DIFF_EQUAL, mid_common]], diffs_b);
  }

  if (checklines && text1.length > 100 && text2.length > 100) {
    return this.diff_lineMode_(text1, text2, deadline);
  }

  return this.diff_bisect_(text1, text2, deadline);
};


/**
 * Do a quick line-level diff on both strings, then rediff the parts for
 * greater accuracy.
 * This speedup can produce non-minimal diffs.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {number} deadline Time when the diff should be complete by.
 * @return {!Array.<!diff_match_patch.Diff>} Array of diff tuples.
 * @private
 */
diff_match_patch.prototype.diff_lineMode_ = function(text1, text2, deadline) {
  // Scan the text on a line-by-line basis first.
  var a = this.diff_linesToChars_(text1, text2);
  text1 = /** @type {string} */(a[0]);
  text2 = /** @type {string} */(a[1]);
  var linearray = /** @type {!Array.<string>} */(a[2]);

  var diffs = this.diff_bisect_(text1, text2, deadline);

  // Convert the diff back to original text.
  this.diff_charsToLines_(diffs, linearray);
  // Eliminate freak matches (e.g. blank lines)
  this.diff_cleanupSemantic(diffs);

  // Rediff any replacement blocks, this time character-by-character.
  // Add a dummy entry at the end.
  diffs.push([DIFF_EQUAL, '']);
  var pointer = 0;
  var count_delete = 0;
  var count_insert = 0;
  var text_delete = '';
  var text_insert = '';
  while (pointer < diffs.length) {
    switch (diffs[pointer][0]) {
      case DIFF_INSERT:
        count_insert++;
        text_insert += diffs[pointer][1];
        break;
      case DIFF_DELETE:
        count_delete++;
        text_delete += diffs[pointer][1];
        break;
      case DIFF_EQUAL:
        // Upon reaching an equality, check for prior redundancies.
        if (count_delete >= 1 && count_insert >= 1) {
          // Delete the offending records and add the merged ones.
          var a = this.diff_main(text_delete, text_insert, false, deadline);
          diffs.splice(pointer - count_delete - count_insert,
                       count_delete + count_insert);
          pointer = pointer - count_delete - count_insert;
          for (var j = a.length - 1; j >= 0; j--) {
            diffs.splice(pointer, 0, a[j]);
          }
          pointer = pointer + a.length;
        }
        count_insert = 0;
        count_delete = 0;
        text_delete = '';
        text_insert = '';
        break;
    }
    pointer++;
  }
  diffs.pop();  // Remove the dummy entry at the end.

  return diffs;
};


/**
 * Find the 'middle snake' of a diff, split the problem in two
 * and return the recursively constructed diff.
 * See Myers 1986 paper: An O(ND) Difference Algorithm and Its Variations.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {number} deadline Time at which to bail if not yet complete.
 * @return {!Array.<!diff_match_patch.Diff>} Array of diff tuples.
 * @private
 */
diff_match_patch.prototype.diff_bisect_ = function(text1, text2, deadline) {
  // Cache the text lengths to prevent multiple calls.
  var text1_length = text1.length;
  var text2_length = text2.length;
  var max_d = Math.ceil((text1_length + text2_length) / 2);
  var v_offset = max_d;
  var v_length = 2 * max_d;
  var v1 = new Array(v_length);
  var v2 = new Array(v_length);
  // Setting all elements to -1 is faster in Chrome & Firefox than mixing
  // integers and undefined.
  for (var x = 0; x < v_length; x++) {
    v1[x] = -1;
    v2[x] = -1;
  }
  v1[v_offset + 1] = 0;
  v2[v_offset + 1] = 0;
  var delta = text1_length - text2_length;
  // If the total number of characters is odd, then the front path will collide
  // with the reverse path.
  var front = (delta % 2 != 0);
  // Offsets for start and end of k loop.
  // Prevents mapping of space beyond the grid.
  var k1start = 0;
  var k1end = 0;
  var k2start = 0;
  var k2end = 0;
  for (var d = 0; d < max_d; d++) {
    // Bail out if deadline is reached.
    if ((new Date()).getTime() > deadline) {
      break;
    }

    // Walk the front path one step.
    for (var k1 = -d + k1start; k1 <= d - k1end; k1 += 2) {
      var k1_offset = v_offset + k1;
      var x1;
      if (k1 == -d || k1 != d && v1[k1_offset - 1] < v1[k1_offset + 1]) {
        x1 = v1[k1_offset + 1];
      } else {
        x1 = v1[k1_offset - 1] + 1;
      }
      var y1 = x1 - k1;
      while (x1 < text1_length && y1 < text2_length &&
             text1.charAt(x1) == text2.charAt(y1)) {
        x1++;
        y1++;
      }
      v1[k1_offset] = x1;
      if (x1 > text1_length) {
        // Ran off the right of the graph.
        k1end += 2;
      } else if (y1 > text2_length) {
        // Ran off the bottom of the graph.
        k1start += 2;
      } else if (front) {
        var k2_offset = v_offset + delta - k1;
        if (k2_offset >= 0 && k2_offset < v_length && v2[k2_offset] != -1) {
          // Mirror x2 onto top-left coordinate system.
          var x2 = text1_length - v2[k2_offset];
          if (x1 >= x2) {
            // Overlap detected.
            return this.diff_bisectSplit_(text1, text2, x1, y1, deadline);
          }
        }
      }
    }

    // Walk the reverse path one step.
    for (var k2 = -d + k2start; k2 <= d - k2end; k2 += 2) {
      var k2_offset = v_offset + k2;
      var x2;
      if (k2 == -d || k2 != d && v2[k2_offset - 1] < v2[k2_offset + 1]) {
        x2 = v2[k2_offset + 1];
      } else {
        x2 = v2[k2_offset - 1] + 1;
      }
      var y2 = x2 - k2;
      while (x2 < text1_length && y2 < text2_length &&
             text1.charAt(text1_length - x2 - 1) ==
             text2.charAt(text2_length - y2 - 1)) {
        x2++;
        y2++;
      }
      v2[k2_offset] = x2;
      if (x2 > text1_length) {
        // Ran off the left of the graph.
        k2end += 2;
      } else if (y2 > text2_length) {
        // Ran off the top of the graph.
        k2start += 2;
      } else if (!front) {
        var k1_offset = v_offset + delta - k2;
        if (k1_offset >= 0 && k1_offset < v_length && v1[k1_offset] != -1) {
          var x1 = v1[k1_offset];
          var y1 = v_offset + x1 - k1_offset;
          // Mirror x2 onto top-left coordinate system.
          x2 = text1_length - x2;
          if (x1 >= x2) {
            // Overlap detected.
            return this.diff_bisectSplit_(text1, text2, x1, y1, deadline);
          }
        }
      }
    }
  }
  // Diff took too long and hit the deadline or
  // number of diffs equals number of characters, no commonality at all.
  return [[DIFF_DELETE, text1], [DIFF_INSERT, text2]];
};


/**
 * Given the location of the 'middle snake', split the diff in two parts
 * and recurse.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {number} x Index of split point in text1.
 * @param {number} y Index of split point in text2.
 * @param {number} deadline Time at which to bail if not yet complete.
 * @return {!Array.<!diff_match_patch.Diff>} Array of diff tuples.
 * @private
 */
diff_match_patch.prototype.diff_bisectSplit_ = function(text1, text2, x, y,
    deadline) {
  var text1a = text1.substring(0, x);
  var text2a = text2.substring(0, y);
  var text1b = text1.substring(x);
  var text2b = text2.substring(y);

  // Compute both diffs serially.
  var diffs = this.diff_main(text1a, text2a, false, deadline);
  var diffsb = this.diff_main(text1b, text2b, false, deadline);

  return diffs.concat(diffsb);
};


/**
 * Split two texts into an array of strings.  Reduce the texts to a string of
 * hashes where each Unicode character represents one line.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {!Array.<string|!Array.<string>>} Three element Array, containing the
 *     encoded text1, the encoded text2 and the array of unique strings.  The
 *     zeroth element of the array of unique strings is intentionally blank.
 * @private
 */
diff_match_patch.prototype.diff_linesToChars_ = function(text1, text2) {
  var lineArray = [];  // e.g. lineArray[4] == 'Hello\n'
  var lineHash = {};   // e.g. lineHash['Hello\n'] == 4

  // '\x00' is a valid character, but various debuggers don't like it.
  // So we'll insert a junk entry to avoid generating a null character.
  lineArray[0] = '';

  /**
   * Split a text into an array of strings.  Reduce the texts to a string of
   * hashes where each Unicode character represents one line.
   * Modifies linearray and linehash through being a closure.
   * @param {string} text String to encode.
   * @return {string} Encoded string.
   * @private
   */
  function diff_linesToCharsMunge_(text) {
    var chars = '';
    // Walk the text, pulling out a substring for each line.
    // text.split('\n') would would temporarily double our memory footprint.
    // Modifying text would create many large strings to garbage collect.
    var lineStart = 0;
    var lineEnd = -1;
    // Keeping our own length variable is faster than looking it up.
    var lineArrayLength = lineArray.length;
    while (lineEnd < text.length - 1) {
      lineEnd = text.indexOf('\n', lineStart);
      if (lineEnd == -1) {
        lineEnd = text.length - 1;
      }
      var line = text.substring(lineStart, lineEnd + 1);
      lineStart = lineEnd + 1;

      if (lineHash.hasOwnProperty ? lineHash.hasOwnProperty(line) :
          (lineHash[line] !== undefined)) {
        chars += String.fromCharCode(lineHash[line]);
      } else {
        chars += String.fromCharCode(lineArrayLength);
        lineHash[line] = lineArrayLength;
        lineArray[lineArrayLength++] = line;
      }
    }
    return chars;
  }

  var chars1 = diff_linesToCharsMunge_(text1);
  var chars2 = diff_linesToCharsMunge_(text2);
  return [chars1, chars2, lineArray];
};


/**
 * Rehydrate the text in a diff from a string of line hashes to real lines of
 * text.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @param {!Array.<string>} lineArray Array of unique strings.
 * @private
 */
diff_match_patch.prototype.diff_charsToLines_ = function(diffs, lineArray) {
  for (var x = 0; x < diffs.length; x++) {
    var chars = diffs[x][1];
    var text = [];
    for (var y = 0; y < chars.length; y++) {
      text[y] = lineArray[chars.charCodeAt(y)];
    }
    diffs[x][1] = text.join('');
  }
};


/**
 * Determine the common prefix of two strings.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {number} The number of characters common to the start of each
 *     string.
 */
diff_match_patch.prototype.diff_commonPrefix = function(text1, text2) {
  // Quick check for common null cases.
  if (!text1 || !text2 || text1.charAt(0) != text2.charAt(0)) {
    return 0;
  }
  // Binary search.
  // Performance analysis: http://neil.fraser.name/news/2007/10/09/
  var pointermin = 0;
  var pointermax = Math.min(text1.length, text2.length);
  var pointermid = pointermax;
  var pointerstart = 0;
  while (pointermin < pointermid) {
    if (text1.substring(pointerstart, pointermid) ==
        text2.substring(pointerstart, pointermid)) {
      pointermin = pointermid;
      pointerstart = pointermin;
    } else {
      pointermax = pointermid;
    }
    pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
  }
  return pointermid;
};


/**
 * Determine the common suffix of two strings.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {number} The number of characters common to the end of each string.
 */
diff_match_patch.prototype.diff_commonSuffix = function(text1, text2) {
  // Quick check for common null cases.
  if (!text1 || !text2 ||
      text1.charAt(text1.length - 1) != text2.charAt(text2.length - 1)) {
    return 0;
  }
  // Binary search.
  // Performance analysis: http://neil.fraser.name/news/2007/10/09/
  var pointermin = 0;
  var pointermax = Math.min(text1.length, text2.length);
  var pointermid = pointermax;
  var pointerend = 0;
  while (pointermin < pointermid) {
    if (text1.substring(text1.length - pointermid, text1.length - pointerend) ==
        text2.substring(text2.length - pointermid, text2.length - pointerend)) {
      pointermin = pointermid;
      pointerend = pointermin;
    } else {
      pointermax = pointermid;
    }
    pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
  }
  return pointermid;
};


/**
 * Determine if the suffix of one string is the prefix of another.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {number} The number of characters common to the end of the first
 *     string and the start of the second string.
 * @private
 */
diff_match_patch.prototype.diff_commonOverlap_ = function(text1, text2) {
  // Cache the text lengths to prevent multiple calls.
  var text1_length = text1.length;
  var text2_length = text2.length;
  // Eliminate the null case.
  if (text1_length == 0 || text2_length == 0) {
    return 0;
  }
  // Truncate the longer string.
  if (text1_length > text2_length) {
    text1 = text1.substring(text1_length - text2_length);
  } else if (text1_length < text2_length) {
    text2 = text2.substring(0, text1_length);
  }
  var text_length = Math.min(text1_length, text2_length);
  // Quick check for the worst case.
  if (text1 == text2) {
    return text_length;
  }

  // Start by looking for a single character match
  // and increase length until no match is found.
  // Performance analysis: http://neil.fraser.name/news/2010/11/04/
  var best = 0;
  var length = 1;
  while (true) {
    var pattern = text1.substring(text_length - length);
    var found = text2.indexOf(pattern);
    if (found == -1) {
      return best;
    }
    length += found;
    if (found == 0 || text1.substring(text_length - length) ==
        text2.substring(0, length)) {
      best = length;
      length++;
    }
  }
};


/**
 * Do the two texts share a substring which is at least half the length of the
 * longer text?
 * This speedup can produce non-minimal diffs.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {Array.<string>} Five element Array, containing the prefix of
 *     text1, the suffix of text1, the prefix of text2, the suffix of
 *     text2 and the common middle.  Or null if there was no match.
 * @private
 */
diff_match_patch.prototype.diff_halfMatch_ = function(text1, text2) {
  if (this.Diff_Timeout <= 0) {
    // Don't risk returning a non-optimal diff if we have unlimited time.
    return null;
  }
  var longtext = text1.length > text2.length ? text1 : text2;
  var shorttext = text1.length > text2.length ? text2 : text1;
  if (longtext.length < 4 || shorttext.length * 2 < longtext.length) {
    return null;  // Pointless.
  }
  var dmp = this;  // 'this' becomes 'window' in a closure.

  /**
   * Does a substring of shorttext exist within longtext such that the substring
   * is at least half the length of longtext?
   * Closure, but does not reference any external variables.
   * @param {string} longtext Longer string.
   * @param {string} shorttext Shorter string.
   * @param {number} i Start index of quarter length substring within longtext.
   * @return {Array.<string>} Five element Array, containing the prefix of
   *     longtext, the suffix of longtext, the prefix of shorttext, the suffix
   *     of shorttext and the common middle.  Or null if there was no match.
   * @private
   */
  function diff_halfMatchI_(longtext, shorttext, i) {
    // Start with a 1/4 length substring at position i as a seed.
    var seed = longtext.substring(i, i + Math.floor(longtext.length / 4));
    var j = -1;
    var best_common = '';
    var best_longtext_a, best_longtext_b, best_shorttext_a, best_shorttext_b;
    while ((j = shorttext.indexOf(seed, j + 1)) != -1) {
      var prefixLength = dmp.diff_commonPrefix(longtext.substring(i),
                                               shorttext.substring(j));
      var suffixLength = dmp.diff_commonSuffix(longtext.substring(0, i),
                                               shorttext.substring(0, j));
      if (best_common.length < suffixLength + prefixLength) {
        best_common = shorttext.substring(j - suffixLength, j) +
            shorttext.substring(j, j + prefixLength);
        best_longtext_a = longtext.substring(0, i - suffixLength);
        best_longtext_b = longtext.substring(i + prefixLength);
        best_shorttext_a = shorttext.substring(0, j - suffixLength);
        best_shorttext_b = shorttext.substring(j + prefixLength);
      }
    }
    if (best_common.length * 2 >= longtext.length) {
      return [best_longtext_a, best_longtext_b,
              best_shorttext_a, best_shorttext_b, best_common];
    } else {
      return null;
    }
  }

  // First check if the second quarter is the seed for a half-match.
  var hm1 = diff_halfMatchI_(longtext, shorttext,
                             Math.ceil(longtext.length / 4));
  // Check again based on the third quarter.
  var hm2 = diff_halfMatchI_(longtext, shorttext,
                             Math.ceil(longtext.length / 2));
  var hm;
  if (!hm1 && !hm2) {
    return null;
  } else if (!hm2) {
    hm = hm1;
  } else if (!hm1) {
    hm = hm2;
  } else {
    // Both matched.  Select the longest.
    hm = hm1[4].length > hm2[4].length ? hm1 : hm2;
  }

  // A half-match was found, sort out the return data.
  var text1_a, text1_b, text2_a, text2_b;
  if (text1.length > text2.length) {
    text1_a = hm[0];
    text1_b = hm[1];
    text2_a = hm[2];
    text2_b = hm[3];
  } else {
    text2_a = hm[0];
    text2_b = hm[1];
    text1_a = hm[2];
    text1_b = hm[3];
  }
  var mid_common = hm[4];
  return [text1_a, text1_b, text2_a, text2_b, mid_common];
};


/**
 * Reduce the number of edits by eliminating semantically trivial equalities.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 */
diff_match_patch.prototype.diff_cleanupSemantic = function(diffs) {
  var changes = false;
  var equalities = [];  // Stack of indices where equalities are found.
  var equalitiesLength = 0;  // Keeping our own length var is faster in JS.
  /** @type {?string} */
  var lastequality = null;  // Always equal to equalities[equalitiesLength-1][1]
  var pointer = 0;  // Index of current position.
  // Number of characters that changed prior to the equality.
  var length_insertions1 = 0;
  var length_deletions1 = 0;
  // Number of characters that changed after the equality.
  var length_insertions2 = 0;
  var length_deletions2 = 0;
  while (pointer < diffs.length) {
    if (diffs[pointer][0] == DIFF_EQUAL) {  // Equality found.
      equalities[equalitiesLength++] = pointer;
      length_insertions1 = length_insertions2;
      length_deletions1 = length_deletions2;
      length_insertions2 = 0;
      length_deletions2 = 0;
      lastequality = /** @type {string} */(diffs[pointer][1]);
    } else {  // An insertion or deletion.
      if (diffs[pointer][0] == DIFF_INSERT) {
        length_insertions2 += diffs[pointer][1].length;
      } else {
        length_deletions2 += diffs[pointer][1].length;
      }
      // Eliminate an equality that is smaller or equal to the edits on both
      // sides of it.
      if (lastequality !== null && (lastequality.length <=
          Math.max(length_insertions1, length_deletions1)) &&
          (lastequality.length <= Math.max(length_insertions2,
                                           length_deletions2))) {
        // Duplicate record.
        diffs.splice(equalities[equalitiesLength - 1], 0,
                     [DIFF_DELETE, lastequality]);
        // Change second copy to insert.
        diffs[equalities[equalitiesLength - 1] + 1][0] = DIFF_INSERT;
        // Throw away the equality we just deleted.
        equalitiesLength--;
        // Throw away the previous equality (it needs to be reevaluated).
        equalitiesLength--;
        pointer = equalitiesLength > 0 ? equalities[equalitiesLength - 1] : -1;
        length_insertions1 = 0;  // Reset the counters.
        length_deletions1 = 0;
        length_insertions2 = 0;
        length_deletions2 = 0;
        lastequality = null;
        changes = true;
      }
    }
    pointer++;
  }

  // Normalize the diff.
  if (changes) {
    this.diff_cleanupMerge(diffs);
  }
  this.diff_cleanupSemanticLossless(diffs);

  // Find any overlaps between deletions and insertions.
  // e.g: <del>abcxxx</del><ins>xxxdef</ins>
  //   -> <del>abc</del>xxx<ins>def</ins>
  // Only extract an overlap if it is as big as the edit ahead or behind it.
  pointer = 1;
  while (pointer < diffs.length) {
    if (diffs[pointer - 1][0] == DIFF_DELETE &&
        diffs[pointer][0] == DIFF_INSERT) {
      var deletion = /** @type {string} */(diffs[pointer - 1][1]);
      var insertion = /** @type {string} */(diffs[pointer][1]);
      var overlap_length = this.diff_commonOverlap_(deletion, insertion);
      if (overlap_length >= deletion.length / 2 ||
          overlap_length >= insertion.length / 2) {
        // Overlap found.  Insert an equality and trim the surrounding edits.
        diffs.splice(pointer, 0,
            [DIFF_EQUAL, insertion.substring(0, overlap_length)]);
        diffs[pointer - 1][1] =
            deletion.substring(0, deletion.length - overlap_length);
        diffs[pointer + 1][1] = insertion.substring(overlap_length);
        pointer++;
      }
      pointer++;
    }
    pointer++;
  }
};


/**
 * Look for single edits surrounded on both sides by equalities
 * which can be shifted sideways to align the edit to a word boundary.
 * e.g: The c<ins>at c</ins>ame. -> The <ins>cat </ins>came.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 */
diff_match_patch.prototype.diff_cleanupSemanticLossless = function(diffs) {
  // Define some regex patterns for matching boundaries.
  var punctuation = /[^a-zA-Z0-9]/;
  var whitespace = /\s/;
  var linebreak = /[\r\n]/;
  var blanklineEnd = /\n\r?\n$/;
  var blanklineStart = /^\r?\n\r?\n/;

  /**
   * Given two strings, compute a score representing whether the internal
   * boundary falls on logical boundaries.
   * Scores range from 5 (best) to 0 (worst).
   * Closure, makes reference to regex patterns defined above.
   * @param {string} one First string.
   * @param {string} two Second string.
   * @return {number} The score.
   * @private
   */
  function diff_cleanupSemanticScore_(one, two) {
    if (!one || !two) {
      // Edges are the best.
      return 5;
    }

    // Each port of this function behaves slightly differently due to
    // subtle differences in each language's definition of things like
    // 'whitespace'.  Since this function's purpose is largely cosmetic,
    // the choice has been made to use each language's native features
    // rather than force total conformity.
    var score = 0;
    // One point for non-alphanumeric.
    if (one.charAt(one.length - 1).match(punctuation) ||
        two.charAt(0).match(punctuation)) {
      score++;
      // Two points for whitespace.
      if (one.charAt(one.length - 1).match(whitespace) ||
          two.charAt(0).match(whitespace)) {
        score++;
        // Three points for line breaks.
        if (one.charAt(one.length - 1).match(linebreak) ||
            two.charAt(0).match(linebreak)) {
          score++;
          // Four points for blank lines.
          if (one.match(blanklineEnd) || two.match(blanklineStart)) {
            score++;
          }
        }
      }
    }
    return score;
  }

  var pointer = 1;
  // Intentionally ignore the first and last element (don't need checking).
  while (pointer < diffs.length - 1) {
    if (diffs[pointer - 1][0] == DIFF_EQUAL &&
        diffs[pointer + 1][0] == DIFF_EQUAL) {
      // This is a single edit surrounded by equalities.
      var equality1 = /** @type {string} */(diffs[pointer - 1][1]);
      var edit = /** @type {string} */(diffs[pointer][1]);
      var equality2 = /** @type {string} */(diffs[pointer + 1][1]);

      // First, shift the edit as far left as possible.
      var commonOffset = this.diff_commonSuffix(equality1, edit);
      if (commonOffset) {
        var commonString = edit.substring(edit.length - commonOffset);
        equality1 = equality1.substring(0, equality1.length - commonOffset);
        edit = commonString + edit.substring(0, edit.length - commonOffset);
        equality2 = commonString + equality2;
      }

      // Second, step character by character right, looking for the best fit.
      var bestEquality1 = equality1;
      var bestEdit = edit;
      var bestEquality2 = equality2;
      var bestScore = diff_cleanupSemanticScore_(equality1, edit) +
          diff_cleanupSemanticScore_(edit, equality2);
      while (edit.charAt(0) === equality2.charAt(0)) {
        equality1 += edit.charAt(0);
        edit = edit.substring(1) + equality2.charAt(0);
        equality2 = equality2.substring(1);
        var score = diff_cleanupSemanticScore_(equality1, edit) +
            diff_cleanupSemanticScore_(edit, equality2);
        // The >= encourages trailing rather than leading whitespace on edits.
        if (score >= bestScore) {
          bestScore = score;
          bestEquality1 = equality1;
          bestEdit = edit;
          bestEquality2 = equality2;
        }
      }

      if (diffs[pointer - 1][1] != bestEquality1) {
        // We have an improvement, save it back to the diff.
        if (bestEquality1) {
          diffs[pointer - 1][1] = bestEquality1;
        } else {
          diffs.splice(pointer - 1, 1);
          pointer--;
        }
        diffs[pointer][1] = bestEdit;
        if (bestEquality2) {
          diffs[pointer + 1][1] = bestEquality2;
        } else {
          diffs.splice(pointer + 1, 1);
          pointer--;
        }
      }
    }
    pointer++;
  }
};


/**
 * Reduce the number of edits by eliminating operationally trivial equalities.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 */
diff_match_patch.prototype.diff_cleanupEfficiency = function(diffs) {
  var changes = false;
  var equalities = [];  // Stack of indices where equalities are found.
  var equalitiesLength = 0;  // Keeping our own length var is faster in JS.
  var lastequality = '';  // Always equal to equalities[equalitiesLength-1][1]
  var pointer = 0;  // Index of current position.
  // Is there an insertion operation before the last equality.
  var pre_ins = false;
  // Is there a deletion operation before the last equality.
  var pre_del = false;
  // Is there an insertion operation after the last equality.
  var post_ins = false;
  // Is there a deletion operation after the last equality.
  var post_del = false;
  while (pointer < diffs.length) {
    if (diffs[pointer][0] == DIFF_EQUAL) {  // Equality found.
      if (diffs[pointer][1].length < this.Diff_EditCost &&
          (post_ins || post_del)) {
        // Candidate found.
        equalities[equalitiesLength++] = pointer;
        pre_ins = post_ins;
        pre_del = post_del;
        lastequality = diffs[pointer][1];
      } else {
        // Not a candidate, and can never become one.
        equalitiesLength = 0;
        lastequality = '';
      }
      post_ins = post_del = false;
    } else {  // An insertion or deletion.
      if (diffs[pointer][0] == DIFF_DELETE) {
        post_del = true;
      } else {
        post_ins = true;
      }
      /*
       * Five types to be split:
       * <ins>A</ins><del>B</del>XY<ins>C</ins><del>D</del>
       * <ins>A</ins>X<ins>C</ins><del>D</del>
       * <ins>A</ins><del>B</del>X<ins>C</ins>
       * <ins>A</del>X<ins>C</ins><del>D</del>
       * <ins>A</ins><del>B</del>X<del>C</del>
       */
      if (lastequality && ((pre_ins && pre_del && post_ins && post_del) ||
                           ((lastequality.length < this.Diff_EditCost / 2) &&
                            (pre_ins + pre_del + post_ins + post_del) == 3))) {
        // Duplicate record.
        diffs.splice(equalities[equalitiesLength - 1], 0,
                     [DIFF_DELETE, lastequality]);
        // Change second copy to insert.
        diffs[equalities[equalitiesLength - 1] + 1][0] = DIFF_INSERT;
        equalitiesLength--;  // Throw away the equality we just deleted;
        lastequality = '';
        if (pre_ins && pre_del) {
          // No changes made which could affect previous entry, keep going.
          post_ins = post_del = true;
          equalitiesLength = 0;
        } else {
          equalitiesLength--;  // Throw away the previous equality.
          pointer = equalitiesLength > 0 ?
              equalities[equalitiesLength - 1] : -1;
          post_ins = post_del = false;
        }
        changes = true;
      }
    }
    pointer++;
  }

  if (changes) {
    this.diff_cleanupMerge(diffs);
  }
};


/**
 * Reorder and merge like edit sections.  Merge equalities.
 * Any edit section can move as long as it doesn't cross an equality.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 */
diff_match_patch.prototype.diff_cleanupMerge = function(diffs) {
  diffs.push([DIFF_EQUAL, '']);  // Add a dummy entry at the end.
  var pointer = 0;
  var count_delete = 0;
  var count_insert = 0;
  var text_delete = '';
  var text_insert = '';
  var commonlength;
  while (pointer < diffs.length) {
    switch (diffs[pointer][0]) {
      case DIFF_INSERT:
        count_insert++;
        text_insert += diffs[pointer][1];
        pointer++;
        break;
      case DIFF_DELETE:
        count_delete++;
        text_delete += diffs[pointer][1];
        pointer++;
        break;
      case DIFF_EQUAL:
        // Upon reaching an equality, check for prior redundancies.
        if (count_delete + count_insert > 1) {
          if (count_delete !== 0 && count_insert !== 0) {
            // Factor out any common prefixies.
            commonlength = this.diff_commonPrefix(text_insert, text_delete);
            if (commonlength !== 0) {
              if ((pointer - count_delete - count_insert) > 0 &&
                  diffs[pointer - count_delete - count_insert - 1][0] ==
                  DIFF_EQUAL) {
                diffs[pointer - count_delete - count_insert - 1][1] +=
                    text_insert.substring(0, commonlength);
              } else {
                diffs.splice(0, 0, [DIFF_EQUAL,
                                    text_insert.substring(0, commonlength)]);
                pointer++;
              }
              text_insert = text_insert.substring(commonlength);
              text_delete = text_delete.substring(commonlength);
            }
            // Factor out any common suffixies.
            commonlength = this.diff_commonSuffix(text_insert, text_delete);
            if (commonlength !== 0) {
              diffs[pointer][1] = text_insert.substring(text_insert.length -
                  commonlength) + diffs[pointer][1];
              text_insert = text_insert.substring(0, text_insert.length -
                  commonlength);
              text_delete = text_delete.substring(0, text_delete.length -
                  commonlength);
            }
          }
          // Delete the offending records and add the merged ones.
          if (count_delete === 0) {
            diffs.splice(pointer - count_delete - count_insert,
                count_delete + count_insert, [DIFF_INSERT, text_insert]);
          } else if (count_insert === 0) {
            diffs.splice(pointer - count_delete - count_insert,
                count_delete + count_insert, [DIFF_DELETE, text_delete]);
          } else {
            diffs.splice(pointer - count_delete - count_insert,
                count_delete + count_insert, [DIFF_DELETE, text_delete],
                [DIFF_INSERT, text_insert]);
          }
          pointer = pointer - count_delete - count_insert +
                    (count_delete ? 1 : 0) + (count_insert ? 1 : 0) + 1;
        } else if (pointer !== 0 && diffs[pointer - 1][0] == DIFF_EQUAL) {
          // Merge this equality with the previous one.
          diffs[pointer - 1][1] += diffs[pointer][1];
          diffs.splice(pointer, 1);
        } else {
          pointer++;
        }
        count_insert = 0;
        count_delete = 0;
        text_delete = '';
        text_insert = '';
        break;
    }
  }
  if (diffs[diffs.length - 1][1] === '') {
    diffs.pop();  // Remove the dummy entry at the end.
  }

  // Second pass: look for single edits surrounded on both sides by equalities
  // which can be shifted sideways to eliminate an equality.
  // e.g: A<ins>BA</ins>C -> <ins>AB</ins>AC
  var changes = false;
  pointer = 1;
  // Intentionally ignore the first and last element (don't need checking).
  while (pointer < diffs.length - 1) {
    if (diffs[pointer - 1][0] == DIFF_EQUAL &&
        diffs[pointer + 1][0] == DIFF_EQUAL) {
      // This is a single edit surrounded by equalities.
      if (diffs[pointer][1].substring(diffs[pointer][1].length -
          diffs[pointer - 1][1].length) == diffs[pointer - 1][1]) {
        // Shift the edit over the previous equality.
        diffs[pointer][1] = diffs[pointer - 1][1] +
            diffs[pointer][1].substring(0, diffs[pointer][1].length -
                                        diffs[pointer - 1][1].length);
        diffs[pointer + 1][1] = diffs[pointer - 1][1] + diffs[pointer + 1][1];
        diffs.splice(pointer - 1, 1);
        changes = true;
      } else if (diffs[pointer][1].substring(0, diffs[pointer + 1][1].length) ==
          diffs[pointer + 1][1]) {
        // Shift the edit over the next equality.
        diffs[pointer - 1][1] += diffs[pointer + 1][1];
        diffs[pointer][1] =
            diffs[pointer][1].substring(diffs[pointer + 1][1].length) +
            diffs[pointer + 1][1];
        diffs.splice(pointer + 1, 1);
        changes = true;
      }
    }
    pointer++;
  }
  // If shifts were made, the diff needs reordering and another shift sweep.
  if (changes) {
    this.diff_cleanupMerge(diffs);
  }
};


/**
 * loc is a location in text1, compute and return the equivalent location in
 * text2.
 * e.g. 'The cat' vs 'The big cat', 1->1, 5->8
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @param {number} loc Location within text1.
 * @return {number} Location within text2.
 */
diff_match_patch.prototype.diff_xIndex = function(diffs, loc) {
  var chars1 = 0;
  var chars2 = 0;
  var last_chars1 = 0;
  var last_chars2 = 0;
  var x;
  for (x = 0; x < diffs.length; x++) {
    if (diffs[x][0] !== DIFF_INSERT) {  // Equality or deletion.
      chars1 += diffs[x][1].length;
    }
    if (diffs[x][0] !== DIFF_DELETE) {  // Equality or insertion.
      chars2 += diffs[x][1].length;
    }
    if (chars1 > loc) {  // Overshot the location.
      break;
    }
    last_chars1 = chars1;
    last_chars2 = chars2;
  }
  // Was the location was deleted?
  if (diffs.length != x && diffs[x][0] === DIFF_DELETE) {
    return last_chars2;
  }
  // Add the remaining character length.
  return last_chars2 + (loc - last_chars1);
};


/**
 * Convert a diff array into a pretty HTML report.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @return {string} HTML representation.
 */
diff_match_patch.prototype.diff_prettyHtml = function(diffs) {
  var html = [];
  var i = 0;
  var pattern_amp = /&/g;
  var pattern_lt = /</g;
  var pattern_gt = />/g;
  var pattern_para = /\n/g;
  for (var x = 0; x < diffs.length; x++) {
    var op = diffs[x][0];    // Operation (insert, delete, equal)
    var data = diffs[x][1];  // Text of change.
    var text = data.replace(pattern_amp, '&amp;').replace(pattern_lt, '&lt;')
        .replace(pattern_gt, '&gt;').replace(pattern_para, '&para;<br>');
    switch (op) {
      case DIFF_INSERT:
        html[x] = '<ins style="background:#e6ffe6;">' + text + '</ins>';
        break;
      case DIFF_DELETE:
        html[x] = '<del style="background:#ffe6e6;">' + text + '</del>';
        break;
      case DIFF_EQUAL:
        html[x] = '<span>' + text + '</span>';
        break;
    }
    if (op !== DIFF_DELETE) {
      i += data.length;
    }
  }
  return html.join('');
};


/**
 * Compute and return the source text (all equalities and deletions).
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @return {string} Source text.
 */
diff_match_patch.prototype.diff_text1 = function(diffs) {
  var text = [];
  for (var x = 0; x < diffs.length; x++) {
    if (diffs[x][0] !== DIFF_INSERT) {
      text[x] = diffs[x][1];
    }
  }
  return text.join('');
};


/**
 * Compute and return the destination text (all equalities and insertions).
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @return {string} Destination text.
 */
diff_match_patch.prototype.diff_text2 = function(diffs) {
  var text = [];
  for (var x = 0; x < diffs.length; x++) {
    if (diffs[x][0] !== DIFF_DELETE) {
      text[x] = diffs[x][1];
    }
  }
  return text.join('');
};


/**
 * Compute the Levenshtein distance; the number of inserted, deleted or
 * substituted characters.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @return {number} Number of changes.
 */
diff_match_patch.prototype.diff_levenshtein = function(diffs) {
  var levenshtein = 0;
  var insertions = 0;
  var deletions = 0;
  for (var x = 0; x < diffs.length; x++) {
    var op = diffs[x][0];
    var data = diffs[x][1];
    switch (op) {
      case DIFF_INSERT:
        insertions += data.length;
        break;
      case DIFF_DELETE:
        deletions += data.length;
        break;
      case DIFF_EQUAL:
        // A deletion and an insertion is one substitution.
        levenshtein += Math.max(insertions, deletions);
        insertions = 0;
        deletions = 0;
        break;
    }
  }
  levenshtein += Math.max(insertions, deletions);
  return levenshtein;
};


/**
 * Crush the diff into an encoded string which describes the operations
 * required to transform text1 into text2.
 * E.g. =3\t-2\t+ing  -> Keep 3 chars, delete 2 chars, insert 'ing'.
 * Operations are tab-separated.  Inserted text is escaped using %xx notation.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @return {string} Delta text.
 */
diff_match_patch.prototype.diff_toDelta = function(diffs) {
  var text = [];
  for (var x = 0; x < diffs.length; x++) {
    switch (diffs[x][0]) {
      case DIFF_INSERT:
        text[x] = '+' + encodeURI(diffs[x][1]);
        break;
      case DIFF_DELETE:
        text[x] = '-' + diffs[x][1].length;
        break;
      case DIFF_EQUAL:
        text[x] = '=' + diffs[x][1].length;
        break;
    }
  }
  return text.join('\t').replace(/%20/g, ' ');
};


/**
 * Given the original text1, and an encoded string which describes the
 * operations required to transform text1 into text2, compute the full diff.
 * @param {string} text1 Source string for the diff.
 * @param {string} delta Delta text.
 * @return {!Array.<!diff_match_patch.Diff>} Array of diff tuples.
 * @throws {!Error} If invalid input.
 */
diff_match_patch.prototype.diff_fromDelta = function(text1, delta) {
  var diffs = [];
  var diffsLength = 0;  // Keeping our own length var is faster in JS.
  var pointer = 0;  // Cursor in text1
  var tokens = delta.split(/\t/g);
  for (var x = 0; x < tokens.length; x++) {
    // Each token begins with a one character parameter which specifies the
    // operation of this token (delete, insert, equality).
    var param = tokens[x].substring(1);
    switch (tokens[x].charAt(0)) {
      case '+':
        try {
          diffs[diffsLength++] = [DIFF_INSERT, decodeURI(param)];
        } catch (ex) {
          // Malformed URI sequence.
          throw new Error('Illegal escape in diff_fromDelta: ' + param);
        }
        break;
      case '-':
        // Fall through.
      case '=':
        var n = parseInt(param, 10);
        if (isNaN(n) || n < 0) {
          throw new Error('Invalid number in diff_fromDelta: ' + param);
        }
        var text = text1.substring(pointer, pointer += n);
        if (tokens[x].charAt(0) == '=') {
          diffs[diffsLength++] = [DIFF_EQUAL, text];
        } else {
          diffs[diffsLength++] = [DIFF_DELETE, text];
        }
        break;
      default:
        // Blank tokens are ok (from a trailing \t).
        // Anything else is an error.
        if (tokens[x]) {
          throw new Error('Invalid diff operation in diff_fromDelta: ' +
                          tokens[x]);
        }
    }
  }
  if (pointer != text1.length) {
    throw new Error('Delta length (' + pointer +
        ') does not equal source text length (' + text1.length + ').');
  }
  return diffs;
};


//  MATCH FUNCTIONS


/**
 * Locate the best instance of 'pattern' in 'text' near 'loc'.
 * @param {string} text The text to search.
 * @param {string} pattern The pattern to search for.
 * @param {number} loc The location to search around.
 * @return {number} Best match index or -1.
 */
diff_match_patch.prototype.match_main = function(text, pattern, loc) {
  // Check for null inputs.
  if (text == null || pattern == null || loc == null) {
    throw new Error('Null input. (match_main)');
  }

  loc = Math.max(0, Math.min(loc, text.length));
  if (text == pattern) {
    // Shortcut (potentially not guaranteed by the algorithm)
    return 0;
  } else if (!text.length) {
    // Nothing to match.
    return -1;
  } else if (text.substring(loc, loc + pattern.length) == pattern) {
    // Perfect match at the perfect spot!  (Includes case of null pattern)
    return loc;
  } else {
    // Do a fuzzy compare.
    return this.match_bitap_(text, pattern, loc);
  }
};


/**
 * Locate the best instance of 'pattern' in 'text' near 'loc' using the
 * Bitap algorithm.
 * @param {string} text The text to search.
 * @param {string} pattern The pattern to search for.
 * @param {number} loc The location to search around.
 * @return {number} Best match index or -1.
 * @private
 */
diff_match_patch.prototype.match_bitap_ = function(text, pattern, loc) {
  if (pattern.length > this.Match_MaxBits) {
    throw new Error('Pattern too long for this browser.');
  }

  // Initialise the alphabet.
  var s = this.match_alphabet_(pattern);

  var dmp = this;  // 'this' becomes 'window' in a closure.

  /**
   * Compute and return the score for a match with e errors and x location.
   * Accesses loc and pattern through being a closure.
   * @param {number} e Number of errors in match.
   * @param {number} x Location of match.
   * @return {number} Overall score for match (0.0 = good, 1.0 = bad).
   * @private
   */
  function match_bitapScore_(e, x) {
    var accuracy = e / pattern.length;
    var proximity = Math.abs(loc - x);
    if (!dmp.Match_Distance) {
      // Dodge divide by zero error.
      return proximity ? 1.0 : accuracy;
    }
    return accuracy + (proximity / dmp.Match_Distance);
  }

  // Highest score beyond which we give up.
  var score_threshold = this.Match_Threshold;
  // Is there a nearby exact match? (speedup)
  var best_loc = text.indexOf(pattern, loc);
  if (best_loc != -1) {
    score_threshold = Math.min(match_bitapScore_(0, best_loc), score_threshold);
    // What about in the other direction? (speedup)
    best_loc = text.lastIndexOf(pattern, loc + pattern.length);
    if (best_loc != -1) {
      score_threshold =
          Math.min(match_bitapScore_(0, best_loc), score_threshold);
    }
  }

  // Initialise the bit arrays.
  var matchmask = 1 << (pattern.length - 1);
  best_loc = -1;

  var bin_min, bin_mid;
  var bin_max = pattern.length + text.length;
  var last_rd;
  for (var d = 0; d < pattern.length; d++) {
    // Scan for the best match; each iteration allows for one more error.
    // Run a binary search to determine how far from 'loc' we can stray at this
    // error level.
    bin_min = 0;
    bin_mid = bin_max;
    while (bin_min < bin_mid) {
      if (match_bitapScore_(d, loc + bin_mid) <= score_threshold) {
        bin_min = bin_mid;
      } else {
        bin_max = bin_mid;
      }
      bin_mid = Math.floor((bin_max - bin_min) / 2 + bin_min);
    }
    // Use the result from this iteration as the maximum for the next.
    bin_max = bin_mid;
    var start = Math.max(1, loc - bin_mid + 1);
    var finish = Math.min(loc + bin_mid, text.length) + pattern.length;

    var rd = Array(finish + 2);
    rd[finish + 1] = (1 << d) - 1;
    for (var j = finish; j >= start; j--) {
      // The alphabet (s) is a sparse hash, so the following line generates
      // warnings.
      var charMatch = s[text.charAt(j - 1)];
      if (d === 0) {  // First pass: exact match.
        rd[j] = ((rd[j + 1] << 1) | 1) & charMatch;
      } else {  // Subsequent passes: fuzzy match.
        rd[j] = ((rd[j + 1] << 1) | 1) & charMatch |
                (((last_rd[j + 1] | last_rd[j]) << 1) | 1) |
                last_rd[j + 1];
      }
      if (rd[j] & matchmask) {
        var score = match_bitapScore_(d, j - 1);
        // This match will almost certainly be better than any existing match.
        // But check anyway.
        if (score <= score_threshold) {
          // Told you so.
          score_threshold = score;
          best_loc = j - 1;
          if (best_loc > loc) {
            // When passing loc, don't exceed our current distance from loc.
            start = Math.max(1, 2 * loc - best_loc);
          } else {
            // Already passed loc, downhill from here on in.
            break;
          }
        }
      }
    }
    // No hope for a (better) match at greater error levels.
    if (match_bitapScore_(d + 1, loc) > score_threshold) {
      break;
    }
    last_rd = rd;
  }
  return best_loc;
};


/**
 * Initialise the alphabet for the Bitap algorithm.
 * @param {string} pattern The text to encode.
 * @return {!Object} Hash of character locations.
 * @private
 */
diff_match_patch.prototype.match_alphabet_ = function(pattern) {
  var s = {};
  for (var i = 0; i < pattern.length; i++) {
    s[pattern.charAt(i)] = 0;
  }
  for (var i = 0; i < pattern.length; i++) {
    s[pattern.charAt(i)] |= 1 << (pattern.length - i - 1);
  }
  return s;
};


//  PATCH FUNCTIONS


/**
 * Increase the context until it is unique,
 * but don't let the pattern expand beyond Match_MaxBits.
 * @param {!diff_match_patch.patch_obj} patch The patch to grow.
 * @param {string} text Source text.
 * @private
 */
diff_match_patch.prototype.patch_addContext_ = function(patch, text) {
  if (text.length == 0) {
    return;
  }
  var pattern = text.substring(patch.start2, patch.start2 + patch.length1);
  var padding = 0;

  // Look for the first and last matches of pattern in text.  If two different
  // matches are found, increase the pattern length.
  while (text.indexOf(pattern) != text.lastIndexOf(pattern) &&
         pattern.length < this.Match_MaxBits - this.Patch_Margin -
         this.Patch_Margin) {
    padding += this.Patch_Margin;
    pattern = text.substring(patch.start2 - padding,
                             patch.start2 + patch.length1 + padding);
  }
  // Add one chunk for good luck.
  padding += this.Patch_Margin;

  // Add the prefix.
  var prefix = text.substring(patch.start2 - padding, patch.start2);
  if (prefix) {
    patch.diffs.unshift([DIFF_EQUAL, prefix]);
  }
  // Add the suffix.
  var suffix = text.substring(patch.start2 + patch.length1,
                              patch.start2 + patch.length1 + padding);
  if (suffix) {
    patch.diffs.push([DIFF_EQUAL, suffix]);
  }

  // Roll back the start points.
  patch.start1 -= prefix.length;
  patch.start2 -= prefix.length;
  // Extend the lengths.
  patch.length1 += prefix.length + suffix.length;
  patch.length2 += prefix.length + suffix.length;
};


/**
 * Compute a list of patches to turn text1 into text2.
 * Use diffs if provided, otherwise compute it ourselves.
 * There are four ways to call this function, depending on what data is
 * available to the caller:
 * Method 1:
 * a = text1, b = text2
 * Method 2:
 * a = diffs
 * Method 3 (optimal):
 * a = text1, b = diffs
 * Method 4 (deprecated, use method 3):
 * a = text1, b = text2, c = diffs
 *
 * @param {string|!Array.<!diff_match_patch.Diff>} a text1 (methods 1,3,4) or
 * Array of diff tuples for text1 to text2 (method 2).
 * @param {string|!Array.<!diff_match_patch.Diff>} opt_b text2 (methods 1,4) or
 * Array of diff tuples for text1 to text2 (method 3) or undefined (method 2).
 * @param {string|!Array.<!diff_match_patch.Diff>} opt_c Array of diff tuples
 * for text1 to text2 (method 4) or undefined (methods 1,2,3).
 * @return {!Array.<!diff_match_patch.patch_obj>} Array of patch objects.
 */
diff_match_patch.prototype.patch_make = function(a, opt_b, opt_c) {
  var text1, diffs;
  if (typeof a == 'string' && typeof opt_b == 'string' &&
      typeof opt_c == 'undefined') {
    // Method 1: text1, text2
    // Compute diffs from text1 and text2.
    text1 = /** @type {string} */(a);
    diffs = this.diff_main(text1, /** @type {string} */(opt_b), true);
    if (diffs.length > 2) {
      this.diff_cleanupSemantic(diffs);
      this.diff_cleanupEfficiency(diffs);
    }
  } else if (a && typeof a == 'object' && typeof opt_b == 'undefined' &&
      typeof opt_c == 'undefined') {
    // Method 2: diffs
    // Compute text1 from diffs.
    diffs = /** @type {!Array.<!diff_match_patch.Diff>} */(a);
    text1 = this.diff_text1(diffs);
  } else if (typeof a == 'string' && opt_b && typeof opt_b == 'object' &&
      typeof opt_c == 'undefined') {
    // Method 3: text1, diffs
    text1 = /** @type {string} */(a);
    diffs = /** @type {!Array.<!diff_match_patch.Diff>} */(opt_b);
  } else if (typeof a == 'string' && typeof opt_b == 'string' &&
      opt_c && typeof opt_c == 'object') {
    // Method 4: text1, text2, diffs
    // text2 is not used.
    text1 = /** @type {string} */(a);
    diffs = /** @type {!Array.<!diff_match_patch.Diff>} */(opt_c);
  } else {
    throw new Error('Unknown call format to patch_make.');
  }

  if (diffs.length === 0) {
    return [];  // Get rid of the null case.
  }
  var patches = [];
  var patch = new diff_match_patch.patch_obj();
  var patchDiffLength = 0;  // Keeping our own length var is faster in JS.
  var char_count1 = 0;  // Number of characters into the text1 string.
  var char_count2 = 0;  // Number of characters into the text2 string.
  // Start with text1 (prepatch_text) and apply the diffs until we arrive at
  // text2 (postpatch_text).  We recreate the patches one by one to determine
  // context info.
  var prepatch_text = text1;
  var postpatch_text = text1;
  for (var x = 0; x < diffs.length; x++) {
    var diff_type = diffs[x][0];
    var diff_text = diffs[x][1];

    if (!patchDiffLength && diff_type !== DIFF_EQUAL) {
      // A new patch starts here.
      patch.start1 = char_count1;
      patch.start2 = char_count2;
    }

    switch (diff_type) {
      case DIFF_INSERT:
        patch.diffs[patchDiffLength++] = diffs[x];
        patch.length2 += diff_text.length;
        postpatch_text = postpatch_text.substring(0, char_count2) + diff_text +
                         postpatch_text.substring(char_count2);
        break;
      case DIFF_DELETE:
        patch.length1 += diff_text.length;
        patch.diffs[patchDiffLength++] = diffs[x];
        postpatch_text = postpatch_text.substring(0, char_count2) +
                         postpatch_text.substring(char_count2 +
                             diff_text.length);
        break;
      case DIFF_EQUAL:
        if (diff_text.length <= 2 * this.Patch_Margin &&
            patchDiffLength && diffs.length != x + 1) {
          // Small equality inside a patch.
          patch.diffs[patchDiffLength++] = diffs[x];
          patch.length1 += diff_text.length;
          patch.length2 += diff_text.length;
        } else if (diff_text.length >= 2 * this.Patch_Margin) {
          // Time for a new patch.
          if (patchDiffLength) {
            this.patch_addContext_(patch, prepatch_text);
            patches.push(patch);
            patch = new diff_match_patch.patch_obj();
            patchDiffLength = 0;
            // Unlike Unidiff, our patch lists have a rolling context.
            // http://code.google.com/p/google-diff-match-patch/wiki/Unidiff
            // Update prepatch text & pos to reflect the application of the
            // just completed patch.
            prepatch_text = postpatch_text;
            char_count1 = char_count2;
          }
        }
        break;
    }

    // Update the current character count.
    if (diff_type !== DIFF_INSERT) {
      char_count1 += diff_text.length;
    }
    if (diff_type !== DIFF_DELETE) {
      char_count2 += diff_text.length;
    }
  }
  // Pick up the leftover patch if not empty.
  if (patchDiffLength) {
    this.patch_addContext_(patch, prepatch_text);
    patches.push(patch);
  }

  return patches;
};


/**
 * Given an array of patches, return another array that is identical.
 * @param {!Array.<!diff_match_patch.patch_obj>} patches Array of patch objects.
 * @return {!Array.<!diff_match_patch.patch_obj>} Array of patch objects.
 */
diff_match_patch.prototype.patch_deepCopy = function(patches) {
  // Making deep copies is hard in JavaScript.
  var patchesCopy = [];
  for (var x = 0; x < patches.length; x++) {
    var patch = patches[x];
    var patchCopy = new diff_match_patch.patch_obj();
    patchCopy.diffs = [];
    for (var y = 0; y < patch.diffs.length; y++) {
      patchCopy.diffs[y] = patch.diffs[y].slice();
    }
    patchCopy.start1 = patch.start1;
    patchCopy.start2 = patch.start2;
    patchCopy.length1 = patch.length1;
    patchCopy.length2 = patch.length2;
    patchesCopy[x] = patchCopy;
  }
  return patchesCopy;
};


/**
 * Merge a set of patches onto the text.  Return a patched text, as well
 * as a list of true/false values indicating which patches were applied.
 * @param {!Array.<!diff_match_patch.patch_obj>} patches Array of patch objects.
 * @param {string} text Old text.
 * @return {!Array.<string|!Array.<boolean>>} Two element Array, containing the
 *      new text and an array of boolean values.
 */
diff_match_patch.prototype.patch_apply = function(patches, text) {
  if (patches.length == 0) {
    return [text, []];
  }

  // Deep copy the patches so that no changes are made to originals.
  patches = this.patch_deepCopy(patches);

  var nullPadding = this.patch_addPadding(patches);
  text = nullPadding + text + nullPadding;

  this.patch_splitMax(patches);
  // delta keeps track of the offset between the expected and actual location
  // of the previous patch.  If there are patches expected at positions 10 and
  // 20, but the first patch was found at 12, delta is 2 and the second patch
  // has an effective expected position of 22.
  var delta = 0;
  var results = [];
  for (var x = 0; x < patches.length; x++) {
    var expected_loc = patches[x].start2 + delta;
    var text1 = this.diff_text1(patches[x].diffs);
    var start_loc;
    var end_loc = -1;
    if (text1.length > this.Match_MaxBits) {
      // patch_splitMax will only provide an oversized pattern in the case of
      // a monster delete.
      start_loc = this.match_main(text, text1.substring(0, this.Match_MaxBits),
                                  expected_loc);
      if (start_loc != -1) {
        end_loc = this.match_main(text,
            text1.substring(text1.length - this.Match_MaxBits),
            expected_loc + text1.length - this.Match_MaxBits);
        if (end_loc == -1 || start_loc >= end_loc) {
          // Can't find valid trailing context.  Drop this patch.
          start_loc = -1;
        }
      }
    } else {
      start_loc = this.match_main(text, text1, expected_loc);
    }
    if (start_loc == -1) {
      // No match found.  :(
      results[x] = false;
      // Subtract the delta for this failed patch from subsequent patches.
      delta -= patches[x].length2 - patches[x].length1;
    } else {
      // Found a match.  :)
      results[x] = true;
      delta = start_loc - expected_loc;
      var text2;
      if (end_loc == -1) {
        text2 = text.substring(start_loc, start_loc + text1.length);
      } else {
        text2 = text.substring(start_loc, end_loc + this.Match_MaxBits);
      }
      if (text1 == text2) {
        // Perfect match, just shove the replacement text in.
        text = text.substring(0, start_loc) +
               this.diff_text2(patches[x].diffs) +
               text.substring(start_loc + text1.length);
      } else {
        // Imperfect match.  Run a diff to get a framework of equivalent
        // indices.
        var diffs = this.diff_main(text1, text2, false);
        if (text1.length > this.Match_MaxBits &&
            this.diff_levenshtein(diffs) / text1.length >
            this.Patch_DeleteThreshold) {
          // The end points match, but the content is unacceptably bad.
          results[x] = false;
        } else {
          this.diff_cleanupSemanticLossless(diffs);
          var index1 = 0;
          var index2;
          for (var y = 0; y < patches[x].diffs.length; y++) {
            var mod = patches[x].diffs[y];
            if (mod[0] !== DIFF_EQUAL) {
              index2 = this.diff_xIndex(diffs, index1);
            }
            if (mod[0] === DIFF_INSERT) {  // Insertion
              text = text.substring(0, start_loc + index2) + mod[1] +
                     text.substring(start_loc + index2);
            } else if (mod[0] === DIFF_DELETE) {  // Deletion
              text = text.substring(0, start_loc + index2) +
                     text.substring(start_loc + this.diff_xIndex(diffs,
                         index1 + mod[1].length));
            }
            if (mod[0] !== DIFF_DELETE) {
              index1 += mod[1].length;
            }
          }
        }
      }
    }
  }
  // Strip the padding off.
  text = text.substring(nullPadding.length, text.length - nullPadding.length);
  return [text, results];
};


/**
 * Add some padding on text start and end so that edges can match something.
 * Intended to be called only from within patch_apply.
 * @param {!Array.<!diff_match_patch.patch_obj>} patches Array of patch objects.
 * @return {string} The padding string added to each side.
 */
diff_match_patch.prototype.patch_addPadding = function(patches) {
  var paddingLength = this.Patch_Margin;
  var nullPadding = '';
  for (var x = 1; x <= paddingLength; x++) {
    nullPadding += String.fromCharCode(x);
  }

  // Bump all the patches forward.
  for (var x = 0; x < patches.length; x++) {
    patches[x].start1 += paddingLength;
    patches[x].start2 += paddingLength;
  }

  // Add some padding on start of first diff.
  var patch = patches[0];
  var diffs = patch.diffs;
  if (diffs.length == 0 || diffs[0][0] != DIFF_EQUAL) {
    // Add nullPadding equality.
    diffs.unshift([DIFF_EQUAL, nullPadding]);
    patch.start1 -= paddingLength;  // Should be 0.
    patch.start2 -= paddingLength;  // Should be 0.
    patch.length1 += paddingLength;
    patch.length2 += paddingLength;
  } else if (paddingLength > diffs[0][1].length) {
    // Grow first equality.
    var extraLength = paddingLength - diffs[0][1].length;
    diffs[0][1] = nullPadding.substring(diffs[0][1].length) + diffs[0][1];
    patch.start1 -= extraLength;
    patch.start2 -= extraLength;
    patch.length1 += extraLength;
    patch.length2 += extraLength;
  }

  // Add some padding on end of last diff.
  patch = patches[patches.length - 1];
  diffs = patch.diffs;
  if (diffs.length == 0 || diffs[diffs.length - 1][0] != DIFF_EQUAL) {
    // Add nullPadding equality.
    diffs.push([DIFF_EQUAL, nullPadding]);
    patch.length1 += paddingLength;
    patch.length2 += paddingLength;
  } else if (paddingLength > diffs[diffs.length - 1][1].length) {
    // Grow last equality.
    var extraLength = paddingLength - diffs[diffs.length - 1][1].length;
    diffs[diffs.length - 1][1] += nullPadding.substring(0, extraLength);
    patch.length1 += extraLength;
    patch.length2 += extraLength;
  }

  return nullPadding;
};


/**
 * Look through the patches and break up any which are longer than the maximum
 * limit of the match algorithm.
 * Intended to be called only from within patch_apply.
 * @param {!Array.<!diff_match_patch.patch_obj>} patches Array of patch objects.
 */
diff_match_patch.prototype.patch_splitMax = function(patches) {
  var patch_size = this.Match_MaxBits;
  for (var x = 0; x < patches.length; x++) {
    if (patches[x].length1 > patch_size) {
      var bigpatch = patches[x];
      // Remove the big old patch.
      patches.splice(x--, 1);
      var start1 = bigpatch.start1;
      var start2 = bigpatch.start2;
      var precontext = '';
      while (bigpatch.diffs.length !== 0) {
        // Create one of several smaller patches.
        var patch = new diff_match_patch.patch_obj();
        var empty = true;
        patch.start1 = start1 - precontext.length;
        patch.start2 = start2 - precontext.length;
        if (precontext !== '') {
          patch.length1 = patch.length2 = precontext.length;
          patch.diffs.push([DIFF_EQUAL, precontext]);
        }
        while (bigpatch.diffs.length !== 0 &&
               patch.length1 < patch_size - this.Patch_Margin) {
          var diff_type = bigpatch.diffs[0][0];
          var diff_text = bigpatch.diffs[0][1];
          if (diff_type === DIFF_INSERT) {
            // Insertions are harmless.
            patch.length2 += diff_text.length;
            start2 += diff_text.length;
            patch.diffs.push(bigpatch.diffs.shift());
            empty = false;
          } else if (diff_type === DIFF_DELETE && patch.diffs.length == 1 &&
                     patch.diffs[0][0] == DIFF_EQUAL &&
                     diff_text.length > 2 * patch_size) {
            // This is a large deletion.  Let it pass in one chunk.
            patch.length1 += diff_text.length;
            start1 += diff_text.length;
            empty = false;
            patch.diffs.push([diff_type, diff_text]);
            bigpatch.diffs.shift();
          } else {
            // Deletion or equality.  Only take as much as we can stomach.
            diff_text = diff_text.substring(0,
                patch_size - patch.length1 - this.Patch_Margin);
            patch.length1 += diff_text.length;
            start1 += diff_text.length;
            if (diff_type === DIFF_EQUAL) {
              patch.length2 += diff_text.length;
              start2 += diff_text.length;
            } else {
              empty = false;
            }
            patch.diffs.push([diff_type, diff_text]);
            if (diff_text == bigpatch.diffs[0][1]) {
              bigpatch.diffs.shift();
            } else {
              bigpatch.diffs[0][1] =
                  bigpatch.diffs[0][1].substring(diff_text.length);
            }
          }
        }
        // Compute the head context for the next patch.
        precontext = this.diff_text2(patch.diffs);
        precontext =
            precontext.substring(precontext.length - this.Patch_Margin);
        // Append the end context for this patch.
        var postcontext = this.diff_text1(bigpatch.diffs)
                              .substring(0, this.Patch_Margin);
        if (postcontext !== '') {
          patch.length1 += postcontext.length;
          patch.length2 += postcontext.length;
          if (patch.diffs.length !== 0 &&
              patch.diffs[patch.diffs.length - 1][0] === DIFF_EQUAL) {
            patch.diffs[patch.diffs.length - 1][1] += postcontext;
          } else {
            patch.diffs.push([DIFF_EQUAL, postcontext]);
          }
        }
        if (!empty) {
          patches.splice(++x, 0, patch);
        }
      }
    }
  }
};


/**
 * Take a list of patches and return a textual representation.
 * @param {!Array.<!diff_match_patch.patch_obj>} patches Array of patch objects.
 * @return {string} Text representation of patches.
 */
diff_match_patch.prototype.patch_toText = function(patches) {
  var text = [];
  for (var x = 0; x < patches.length; x++) {
    text[x] = patches[x];
  }
  return text.join('');
};


/**
 * Parse a textual representation of patches and return a list of patch objects.
 * @param {string} textline Text representation of patches.
 * @return {!Array.<!diff_match_patch.patch_obj>} Array of patch objects.
 * @throws {!Error} If invalid input.
 */
diff_match_patch.prototype.patch_fromText = function(textline) {
  var patches = [];
  if (!textline) {
    return patches;
  }
  var text = textline.split('\n');
  var textPointer = 0;
  var patchHeader = /^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@$/;
  while (textPointer < text.length) {
    var m = text[textPointer].match(patchHeader);
    if (!m) {
      throw new Error('Invalid patch string: ' + text[textPointer]);
    }
    var patch = new diff_match_patch.patch_obj();
    patches.push(patch);
    patch.start1 = parseInt(m[1], 10);
    if (m[2] === '') {
      patch.start1--;
      patch.length1 = 1;
    } else if (m[2] == '0') {
      patch.length1 = 0;
    } else {
      patch.start1--;
      patch.length1 = parseInt(m[2], 10);
    }

    patch.start2 = parseInt(m[3], 10);
    if (m[4] === '') {
      patch.start2--;
      patch.length2 = 1;
    } else if (m[4] == '0') {
      patch.length2 = 0;
    } else {
      patch.start2--;
      patch.length2 = parseInt(m[4], 10);
    }
    textPointer++;

    while (textPointer < text.length) {
      var sign = text[textPointer].charAt(0);
      try {
        var line = decodeURI(text[textPointer].substring(1));
      } catch (ex) {
        // Malformed URI sequence.
        throw new Error('Illegal escape in patch_fromText: ' + line);
      }
      if (sign == '-') {
        // Deletion.
        patch.diffs.push([DIFF_DELETE, line]);
      } else if (sign == '+') {
        // Insertion.
        patch.diffs.push([DIFF_INSERT, line]);
      } else if (sign == ' ') {
        // Minor equality.
        patch.diffs.push([DIFF_EQUAL, line]);
      } else if (sign == '@') {
        // Start of next patch.
        break;
      } else if (sign === '') {
        // Blank line?  Whatever.
      } else {
        // WTF?
        throw new Error('Invalid patch mode "' + sign + '" in: ' + line);
      }
      textPointer++;
    }
  }
  return patches;
};


/**
 * Class representing one patch operation.
 * @constructor
 */
diff_match_patch.patch_obj = function() {
  /** @type {!Array.<!diff_match_patch.Diff>} */
  this.diffs = [];
  /** @type {?number} */
  this.start1 = null;
  /** @type {?number} */
  this.start2 = null;
  /** @type {number} */
  this.length1 = 0;
  /** @type {number} */
  this.length2 = 0;
};


/**
 * Emmulate GNU diff's format.
 * Header: @@ -382,8 +481,9 @@
 * Indicies are printed as 1-based, not 0-based.
 * @return {string} The GNU diff string.
 */
diff_match_patch.patch_obj.prototype.toString = function() {
  var coords1, coords2;
  if (this.length1 === 0) {
    coords1 = this.start1 + ',0';
  } else if (this.length1 == 1) {
    coords1 = this.start1 + 1;
  } else {
    coords1 = (this.start1 + 1) + ',' + this.length1;
  }
  if (this.length2 === 0) {
    coords2 = this.start2 + ',0';
  } else if (this.length2 == 1) {
    coords2 = this.start2 + 1;
  } else {
    coords2 = (this.start2 + 1) + ',' + this.length2;
  }
  var text = ['@@ -' + coords1 + ' +' + coords2 + ' @@\n'];
  var op;
  // Escape the body of the patch with %xx notation.
  for (var x = 0; x < this.diffs.length; x++) {
    switch (this.diffs[x][0]) {
      case DIFF_INSERT:
        op = '+';
        break;
      case DIFF_DELETE:
        op = '-';
        break;
      case DIFF_EQUAL:
        op = ' ';
        break;
    }
    text[x + 1] = op + encodeURI(this.diffs[x][1]) + '\n';
  }
  return text.join('').replace(/%20/g, ' ');
};


// Export these global variables so that they survive Google's JS compiler.
// In a browser, 'this' will be 'window'.
// In node.js 'this' will be a global object.
this['diff_match_patch'] = diff_match_patch;
this['DIFF_DELETE'] = DIFF_DELETE;
this['DIFF_INSERT'] = DIFF_INSERT;
this['DIFF_EQUAL'] = DIFF_EQUAL;


},{}],8:[function(require,module,exports){

var Pipe = require('../pipe').Pipe;

var Context = function Context(){
};

Context.prototype.setResult = function(result) {
	this.result = result;
	this.hasResult = true;
	return this;
};

Context.prototype.exit = function() {
	this.exiting = true;
	return this;
};

Context.prototype.switchTo = function(next, pipe) {
	if (typeof next === 'string' || next instanceof Pipe) {
		this.nextPipe = next;
	} else {
		this.next = next;
		if (pipe) {
			this.nextPipe = pipe;
		}
	}
	return this;
};

Context.prototype.push = function(child, name) {
	child.parent = this;
	if (typeof name !== 'undefined') {
		child.childName = name;
	}
	child.root = this.root || this;
	child.options = child.options || this.options;
	if (!this.children) {
		this.children = [child];
		this.nextAfterChildren = this.next || null;
		this.next = child;
	} else {
		this.children[this.children.length - 1].next = child;
		this.children.push(child);
	}
	child.next = this;
	return this;
};

exports.Context = Context;

},{"../pipe":22}],9:[function(require,module,exports){
var Context = require('./context').Context;

var DiffContext = function DiffContext(left, right) {
  this.left = left;
  this.right = right;
  this.pipe = 'diff';
};

DiffContext.prototype = new Context();

exports.DiffContext = DiffContext;

},{"./context":8}],10:[function(require,module,exports){
var Context = require('./context').Context;

var PatchContext = function PatchContext(left, delta) {
  this.left = left;
  this.delta = delta;
  this.pipe = 'patch';
};

PatchContext.prototype = new Context();

exports.PatchContext = PatchContext;

},{"./context":8}],11:[function(require,module,exports){
var Context = require('./context').Context;

var ReverseContext = function ReverseContext(delta) {
  this.delta = delta;
  this.pipe = 'reverse';
};

ReverseContext.prototype = new Context();

exports.ReverseContext = ReverseContext;

},{"./context":8}],12:[function(require,module,exports){
// use as 2nd parameter for JSON.parse to revive Date instances
module.exports = function dateReviver(key, value) {
  var parts;
  if (typeof value === 'string') {
    parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d*))?(Z|([+\-])(\d{2}):(\d{2}))$/.exec(value);
    if (parts) {
      return new Date(Date.UTC(+parts[1], +parts[2] - 1, +parts[3], +parts[4], +parts[5], +parts[6], +(parts[7] || 0)));
    }
  }
  return value;
};

},{}],13:[function(require,module,exports){
var Processor = require('./processor').Processor;
var Pipe = require('./pipe').Pipe;
var DiffContext = require('./contexts/diff').DiffContext;
var PatchContext = require('./contexts/patch').PatchContext;
var ReverseContext = require('./contexts/reverse').ReverseContext;

var trivial = require('./filters/trivial');
var nested = require('./filters/nested');
var arrays = require('./filters/arrays');
var dates = require('./filters/dates');
var texts = require('./filters/texts');

var DiffPatcher = function DiffPatcher(options) {
  this.processor = new Processor(options);
  this.processor.pipe(new Pipe('diff').append(
    nested.collectChildrenDiffFilter,
    trivial.diffFilter,
    dates.diffFilter,
    texts.diffFilter,
    nested.objectsDiffFilter,
    arrays.diffFilter
  ).shouldHaveResult());
  this.processor.pipe(new Pipe('patch').append(
    nested.collectChildrenPatchFilter,
    arrays.collectChildrenPatchFilter,
    trivial.patchFilter,
    texts.patchFilter,
    nested.patchFilter,
    arrays.patchFilter
  ).shouldHaveResult());
  this.processor.pipe(new Pipe('reverse').append(
    nested.collectChildrenReverseFilter,
    arrays.collectChildrenReverseFilter,
    trivial.reverseFilter,
    texts.reverseFilter,
    nested.reverseFilter,
    arrays.reverseFilter
  ).shouldHaveResult());
};

DiffPatcher.prototype.options = function() {
  return this.processor.options.apply(this.processor, arguments);
};

DiffPatcher.prototype.diff = function(left, right) {
  return this.processor.process(new DiffContext(left, right));
};

DiffPatcher.prototype.patch = function(left, delta) {
  return this.processor.process(new PatchContext(left, delta));
};

DiffPatcher.prototype.reverse = function(delta) {
  return this.processor.process(new ReverseContext(delta));
};

DiffPatcher.prototype.unpatch = function(right, delta) {
  return this.patch(right, this.reverse(delta));
};

exports.DiffPatcher = DiffPatcher;

},{"./contexts/diff":9,"./contexts/patch":10,"./contexts/reverse":11,"./filters/arrays":15,"./filters/dates":16,"./filters/nested":18,"./filters/texts":19,"./filters/trivial":20,"./pipe":22,"./processor":23}],14:[function(require,module,exports){

exports.isBrowser = typeof window !== 'undefined';

},{}],15:[function(require,module,exports){
var DiffContext = require('../contexts/diff').DiffContext;
var PatchContext = require('../contexts/patch').PatchContext;
var ReverseContext = require('../contexts/reverse').ReverseContext;

var lcs = require('./lcs');

var ARRAY_MOVE = 3;

var isArray = (typeof Array.isArray === 'function') ?
  // use native function
  Array.isArray :
  // use instanceof operator
  function(a) {
    return a instanceof Array;
  };

var arrayIndexOf = typeof Array.prototype.indexOf === 'function' ?
  function(array, item) {
    return array.indexOf(item);
  } : function(array, item) {
    var length = array.length;
    for (var i = 0; i < length; i++) {
      if (array[i] === item) {
        return i;
      }
    }
    return -1;
  };

function arraysHaveMatchByRef(array1, array2, len1, len2) {
  for (var index1 = 0; index1 < len1; index1++) {
    var val1 = array1[index1];
    for (var index2 = 0; index2 < len2; index2++) {
      var val2 = array2[index2];
      if (val1 === val2) {
        return true;
      }
    }
  }
}

function matchItems(array1, array2, index1, index2, context) {
  var value1 = array1[index1];
  var value2 = array2[index2];
  if (value1 === value2) {
    return true;
  }
  if (typeof value1 !== 'object' || typeof value2 !== 'object') {
    return false;
  }
  var objectHash = context.objectHash;
  if (!objectHash) {
    // no way to match objects was provided, try match by position
    return context.matchByPosition && index1 === index2;
  }
  var hash1;
  var hash2;
  if (typeof index1 === 'number') {
    context.hashCache1 = context.hashCache1 || [];
    hash1 = context.hashCache1[index1];
    if (typeof hash1 === 'undefined') {
      context.hashCache1[index1] = hash1 = objectHash(value1, index1);
    }
  } else {
    hash1 = objectHash(value1);
  }
  if (typeof hash1 === 'undefined') {
    return false;
  }
  if (typeof index2 === 'number') {
    context.hashCache2 = context.hashCache2 || [];
    hash2 = context.hashCache2[index2];
    if (typeof hash2 === 'undefined') {
      context.hashCache2[index2] = hash2 = objectHash(value2, index2);
    }
  } else {
    hash2 = objectHash(value2);
  }
  if (typeof hash2 === 'undefined') {
    return false;
  }
  return hash1 === hash2;
}

var diffFilter = function arraysDiffFilter(context) {
  if (!context.leftIsArray) {
    return;
  }

  var matchContext = {
    objectHash: context.options && context.options.objectHash,
    matchByPosition: context.options && context.options.matchByPosition
  };
  var commonHead = 0;
  var commonTail = 0;
  var index;
  var index1;
  var index2;
  var array1 = context.left;
  var array2 = context.right;
  var len1 = array1.length;
  var len2 = array2.length;

  var child;

  if (len1 > 0 && len2 > 0 && !matchContext.objectHash &&
    typeof matchContext.matchByPosition !== 'boolean') {
    matchContext.matchByPosition = !arraysHaveMatchByRef(array1, array2, len1, len2);
  }

  // separate common head
  while (commonHead < len1 && commonHead < len2 &&
    matchItems(array1, array2, commonHead, commonHead, matchContext)) {
    index = commonHead;
    child = new DiffContext(context.left[index], context.right[index]);
    context.push(child, index);
    commonHead++;
  }
  // separate common tail
  while (commonTail + commonHead < len1 && commonTail + commonHead < len2 &&
    matchItems(array1, array2, len1 - 1 - commonTail, len2 - 1 - commonTail, matchContext)) {
    index1 = len1 - 1 - commonTail;
    index2 = len2 - 1 - commonTail;
    child = new DiffContext(context.left[index1], context.right[index2]);
    context.push(child, index2);
    commonTail++;
  }
  var result;
  if (commonHead + commonTail === len1) {
    if (len1 === len2) {
      // arrays are identical
      context.setResult(undefined).exit();
      return;
    }
    // trivial case, a block (1 or more consecutive items) was added
    result = result || {
      _t: 'a'
    };
    for (index = commonHead; index < len2 - commonTail; index++) {
      result[index] = [array2[index]];
    }
    context.setResult(result).exit();
    return;
  }
  if (commonHead + commonTail === len2) {
    // trivial case, a block (1 or more consecutive items) was removed
    result = result || {
      _t: 'a'
    };
    for (index = commonHead; index < len1 - commonTail; index++) {
      result['_' + index] = [array1[index], 0, 0];
    }
    context.setResult(result).exit();
    return;
  }
  // reset hash cache
  delete matchContext.hashCache1;
  delete matchContext.hashCache2;

  // diff is not trivial, find the LCS (Longest Common Subsequence)
  var trimmed1 = array1.slice(commonHead, len1 - commonTail);
  var trimmed2 = array2.slice(commonHead, len2 - commonTail);
  var seq = lcs.get(
    trimmed1, trimmed2,
    matchItems,
    matchContext
  );
  var removedItems = [];
  result = result || {
    _t: 'a'
  };
  for (index = commonHead; index < len1 - commonTail; index++) {
    if (arrayIndexOf(seq.indices1, index - commonHead) < 0) {
      // removed
      result['_' + index] = [array1[index], 0, 0];
      removedItems.push(index);
    }
  }

  var detectMove = true;
  if (context.options && context.options.arrays && context.options.arrays.detectMove === false) {
    detectMove = false;
  }
  var includeValueOnMove = false;
  if (context.options && context.options.arrays && context.options.arrays.includeValueOnMove) {
    includeValueOnMove = true;
  }

  var removedItemsLength = removedItems.length;
  for (index = commonHead; index < len2 - commonTail; index++) {
    var indexOnArray2 = arrayIndexOf(seq.indices2, index - commonHead);
    if (indexOnArray2 < 0) {
      // added, try to match with a removed item and register as position move
      var isMove = false;
      if (detectMove && removedItemsLength > 0) {
        for (var removeItemIndex1 = 0; removeItemIndex1 < removedItemsLength; removeItemIndex1++) {
          index1 = removedItems[removeItemIndex1];
          if (matchItems(trimmed1, trimmed2, index1 - commonHead,
            index - commonHead, matchContext)) {
            // store position move as: [originalValue, newPosition, ARRAY_MOVE]
            result['_' + index1].splice(1, 2, index, ARRAY_MOVE);
            if (!includeValueOnMove) {
              // don't include moved value on diff, to save bytes
              result['_' + index1][0] = '';
            }

            index2 = index;
            child = new DiffContext(context.left[index1], context.right[index2]);
            context.push(child, index2);
            removedItems.splice(removeItemIndex1, 1);
            isMove = true;
            break;
          }
        }
      }
      if (!isMove) {
        // added
        result[index] = [array2[index]];
      }
    } else {
      // match, do inner diff
      index1 = seq.indices1[indexOnArray2] + commonHead;
      index2 = seq.indices2[indexOnArray2] + commonHead;
      child = new DiffContext(context.left[index1], context.right[index2]);
      context.push(child, index2);
    }
  }

  context.setResult(result).exit();

};
diffFilter.filterName = 'arrays';

var compare = {
  numerically: function(a, b) {
    return a - b;
  },
  numericallyBy: function(name) {
    return function(a, b) {
      return a[name] - b[name];
    };
  }
};

var patchFilter = function nestedPatchFilter(context) {
  if (!context.nested) {
    return;
  }
  if (context.delta._t !== 'a') {
    return;
  }
  var index, index1;

  var delta = context.delta;
  var array = context.left;

  // first, separate removals, insertions and modifications
  var toRemove = [];
  var toInsert = [];
  var toModify = [];
  for (index in delta) {
    if (index !== '_t') {
      if (index[0] === '_') {
        // removed item from original array
        if (delta[index][2] === 0 || delta[index][2] === ARRAY_MOVE) {
          toRemove.push(parseInt(index.slice(1), 10));
        } else {
          throw new Error('only removal or move can be applied at original array indices' +
            ', invalid diff type: ' + delta[index][2]);
        }
      } else {
        if (delta[index].length === 1) {
          // added item at new array
          toInsert.push({
            index: parseInt(index, 10),
            value: delta[index][0]
          });
        } else {
          // modified item at new array
          toModify.push({
            index: parseInt(index, 10),
            delta: delta[index]
          });
        }
      }
    }
  }

  // remove items, in reverse order to avoid sawing our own floor
  toRemove = toRemove.sort(compare.numerically);
  for (index = toRemove.length - 1; index >= 0; index--) {
    index1 = toRemove[index];
    var indexDiff = delta['_' + index1];
    var removedValue = array.splice(index1, 1)[0];
    if (indexDiff[2] === ARRAY_MOVE) {
      // reinsert later
      toInsert.push({
        index: indexDiff[1],
        value: removedValue
      });
    }
  }

  // insert items, in reverse order to avoid moving our own floor
  toInsert = toInsert.sort(compare.numericallyBy('index'));
  var toInsertLength = toInsert.length;
  for (index = 0; index < toInsertLength; index++) {
    var insertion = toInsert[index];
    array.splice(insertion.index, 0, insertion.value);
  }

  // apply modifications
  var toModifyLength = toModify.length;
  var child;
  if (toModifyLength > 0) {
    for (index = 0; index < toModifyLength; index++) {
      var modification = toModify[index];
      child = new PatchContext(context.left[modification.index], modification.delta);
      context.push(child, modification.index);
    }
  }

  if (!context.children) {
    context.setResult(context.left).exit();
    return;
  }
  context.exit();
};
patchFilter.filterName = 'arrays';

var collectChildrenPatchFilter = function collectChildrenPatchFilter(context) {
  if (!context || !context.children) {
    return;
  }
  if (context.delta._t !== 'a') {
    return;
  }
  var length = context.children.length;
  var child;
  for (var index = 0; index < length; index++) {
    child = context.children[index];
    context.left[child.childName] = child.result;
  }
  context.setResult(context.left).exit();
};
collectChildrenPatchFilter.filterName = 'arraysCollectChildren';

var reverseFilter = function arraysReverseFilter(context) {
  if (!context.nested) {
    if (context.delta[2] === ARRAY_MOVE) {
      context.newName = '_' + context.delta[1];
      context.setResult([context.delta[0], parseInt(context.childName.substr(1), 10), ARRAY_MOVE]).exit();
    }
    return;
  }
  if (context.delta._t !== 'a') {
    return;
  }
  var name, child;
  for (name in context.delta) {
    if (name === '_t') {
      continue;
    }
    child = new ReverseContext(context.delta[name]);
    context.push(child, name);
  }
  context.exit();
};
reverseFilter.filterName = 'arrays';

var reverseArrayDeltaIndex = function(delta, index, itemDelta) {
  if (typeof index === 'string' && index[0] === '_') {
    return parseInt(index.substr(1), 10);
  } else if (isArray(itemDelta) && itemDelta[2] === 0) {
    return '_' + index;
  }

  var reverseIndex = +index;
  for (var deltaIndex in delta) {
    var deltaItem = delta[deltaIndex];
    if (isArray(deltaItem)) {
      if (deltaItem[2] === ARRAY_MOVE) {
        var moveFromIndex = parseInt(deltaIndex.substr(1), 10);
        var moveToIndex = deltaItem[1];
        if (moveToIndex === +index) {
          return moveFromIndex;
        }
        if (moveFromIndex <= reverseIndex && moveToIndex > reverseIndex) {
          reverseIndex++;
        } else if (moveFromIndex >= reverseIndex && moveToIndex < reverseIndex) {
          reverseIndex--;
        }
      } else if (deltaItem[2] === 0) {
        var deleteIndex = parseInt(deltaIndex.substr(1), 10);
        if (deleteIndex <= reverseIndex) {
          reverseIndex++;
        }
      } else if (deltaItem.length === 1 && deltaIndex <= reverseIndex) {
        reverseIndex--;
      }
    }
  }

  return reverseIndex;
};

var collectChildrenReverseFilter = function collectChildrenReverseFilter(context) {
  if (!context || !context.children) {
    return;
  }
  if (context.delta._t !== 'a') {
    return;
  }
  var length = context.children.length;
  var child;
  var delta = {
    _t: 'a'
  };

  for (var index = 0; index < length; index++) {
    child = context.children[index];
    var name = child.newName;
    if (typeof name === 'undefined') {
      name = reverseArrayDeltaIndex(context.delta, child.childName, child.result);
    }
    if (delta[name] !== child.result) {
      delta[name] = child.result;
    }
  }
  context.setResult(delta).exit();
};
collectChildrenReverseFilter.filterName = 'arraysCollectChildren';

exports.diffFilter = diffFilter;
exports.patchFilter = patchFilter;
exports.collectChildrenPatchFilter = collectChildrenPatchFilter;
exports.reverseFilter = reverseFilter;
exports.collectChildrenReverseFilter = collectChildrenReverseFilter;

},{"../contexts/diff":9,"../contexts/patch":10,"../contexts/reverse":11,"./lcs":17}],16:[function(require,module,exports){
var diffFilter = function datesDiffFilter(context) {
  if (context.left instanceof Date) {
    if (context.right instanceof Date) {
      if (context.left.getTime() !== context.right.getTime()) {
        context.setResult([context.left, context.right]);
      } else {
        context.setResult(undefined);
      }
    } else {
      context.setResult([context.left, context.right]);
    }
    context.exit();
  } else if (context.right instanceof Date) {
    context.setResult([context.left, context.right]).exit();
  }
};
diffFilter.filterName = 'dates';

exports.diffFilter = diffFilter;

},{}],17:[function(require,module,exports){
/*

LCS implementation that supports arrays or strings

reference: http://en.wikipedia.org/wiki/Longest_common_subsequence_problem

*/

var defaultMatch = function(array1, array2, index1, index2) {
  return array1[index1] === array2[index2];
};

var lengthMatrix = function(array1, array2, match, context) {
  var len1 = array1.length;
  var len2 = array2.length;
  var x, y;

  // initialize empty matrix of len1+1 x len2+1
  var matrix = [len1 + 1];
  for (x = 0; x < len1 + 1; x++) {
    matrix[x] = [len2 + 1];
    for (y = 0; y < len2 + 1; y++) {
      matrix[x][y] = 0;
    }
  }
  matrix.match = match;
  // save sequence lengths for each coordinate
  for (x = 1; x < len1 + 1; x++) {
    for (y = 1; y < len2 + 1; y++) {
      if (match(array1, array2, x - 1, y - 1, context)) {
        matrix[x][y] = matrix[x - 1][y - 1] + 1;
      } else {
        matrix[x][y] = Math.max(matrix[x - 1][y], matrix[x][y - 1]);
      }
    }
  }
  return matrix;
};

var backtrack = function(matrix, array1, array2, index1, index2, context) {
  if (index1 === 0 || index2 === 0) {
    return {
      sequence: [],
      indices1: [],
      indices2: []
    };
  }

  if (matrix.match(array1, array2, index1 - 1, index2 - 1, context)) {
    var subsequence = backtrack(matrix, array1, array2, index1 - 1, index2 - 1, context);
    subsequence.sequence.push(array1[index1 - 1]);
    subsequence.indices1.push(index1 - 1);
    subsequence.indices2.push(index2 - 1);
    return subsequence;
  }

  if (matrix[index1][index2 - 1] > matrix[index1 - 1][index2]) {
    return backtrack(matrix, array1, array2, index1, index2 - 1, context);
  } else {
    return backtrack(matrix, array1, array2, index1 - 1, index2, context);
  }
};

var get = function(array1, array2, match, context) {
  context = context || {};
  var matrix = lengthMatrix(array1, array2, match || defaultMatch, context);
  var result = backtrack(matrix, array1, array2, array1.length, array2.length, context);
  if (typeof array1 === 'string' && typeof array2 === 'string') {
    result.sequence = result.sequence.join('');
  }
  return result;
};

exports.get = get;

},{}],18:[function(require,module,exports){
var DiffContext = require('../contexts/diff').DiffContext;
var PatchContext = require('../contexts/patch').PatchContext;
var ReverseContext = require('../contexts/reverse').ReverseContext;

var collectChildrenDiffFilter = function collectChildrenDiffFilter(context) {
  if (!context || !context.children) {
    return;
  }
  var length = context.children.length;
  var child;
  var result = context.result;
  for (var index = 0; index < length; index++) {
    child = context.children[index];
    if (typeof child.result === 'undefined') {
      continue;
    }
    result = result || {};
    result[child.childName] = child.result;
  }
  if (result && context.leftIsArray) {
    result._t = 'a';
  }
  context.setResult(result).exit();
};
collectChildrenDiffFilter.filterName = 'collectChildren';

var objectsDiffFilter = function objectsDiffFilter(context) {
  if (context.leftIsArray || context.leftType !== 'object') {
    return;
  }

  var name, child;
  for (name in context.left) {
    child = new DiffContext(context.left[name], context.right[name]);
    context.push(child, name);
  }
  for (name in context.right) {
    if (typeof context.left[name] === 'undefined') {
      child = new DiffContext(undefined, context.right[name]);
      context.push(child, name);
    }
  }

  if (!context.children || context.children.length === 0) {
    context.setResult(undefined).exit();
    return;
  }
  context.exit();
};
objectsDiffFilter.filterName = 'objects';

var patchFilter = function nestedPatchFilter(context) {
  if (!context.nested) {
    return;
  }
  if (context.delta._t) {
    return;
  }
  var name, child;
  for (name in context.delta) {
    child = new PatchContext(context.left[name], context.delta[name]);
    context.push(child, name);
  }
  context.exit();
};
patchFilter.filterName = 'objects';

var collectChildrenPatchFilter = function collectChildrenPatchFilter(context) {
  if (!context || !context.children) {
    return;
  }
  if (context.delta._t) {
    return;
  }
  var length = context.children.length;
  var child;
  for (var index = 0; index < length; index++) {
    child = context.children[index];
    if (context.left.hasOwnProperty(child.childName) && child.result === undefined) {
      delete context.left[child.childName];
    } else if (context.left[child.childName] !== child.result) {
      context.left[child.childName] = child.result;
    }
  }
  context.setResult(context.left).exit();
};
collectChildrenPatchFilter.filterName = 'collectChildren';

var reverseFilter = function nestedReverseFilter(context) {
  if (!context.nested) {
    return;
  }
  if (context.delta._t) {
    return;
  }
  var name, child;
  for (name in context.delta) {
    child = new ReverseContext(context.delta[name]);
    context.push(child, name);
  }
  context.exit();
};
reverseFilter.filterName = 'objects';

var collectChildrenReverseFilter = function collectChildrenReverseFilter(context) {
  if (!context || !context.children) {
    return;
  }
  if (context.delta._t) {
    return;
  }
  var length = context.children.length;
  var child;
  var delta = {};
  for (var index = 0; index < length; index++) {
    child = context.children[index];
    if (delta[child.childName] !== child.result) {
      delta[child.childName] = child.result;
    }
  }
  context.setResult(delta).exit();
};
collectChildrenReverseFilter.filterName = 'collectChildren';

exports.collectChildrenDiffFilter = collectChildrenDiffFilter;
exports.objectsDiffFilter = objectsDiffFilter;
exports.patchFilter = patchFilter;
exports.collectChildrenPatchFilter = collectChildrenPatchFilter;
exports.reverseFilter = reverseFilter;
exports.collectChildrenReverseFilter = collectChildrenReverseFilter;

},{"../contexts/diff":9,"../contexts/patch":10,"../contexts/reverse":11}],19:[function(require,module,exports){
/* global diff_match_patch */
var TEXT_DIFF = 2;
var DEFAULT_MIN_LENGTH = 60;
var cachedDiffPatch = null;

var getDiffMatchPatch = function() {
  /*jshint camelcase: false */

  if (!cachedDiffPatch) {
    var instance;
    if (typeof diff_match_patch !== 'undefined') {
      // already loaded, probably a browser
      instance = typeof diff_match_patch === 'function' ?
        new diff_match_patch() : new diff_match_patch.diff_match_patch();
    } else if (typeof require === 'function') {
      try {
        var dmpModuleName = 'diff_match_patch_uncompressed';
        var dmp = require('../../public/external/' + dmpModuleName);
        instance = new dmp.diff_match_patch();
      } catch (err) {
        instance = null;
      }
    }
    if (!instance) {
      var error = new Error('text diff_match_patch library not found');
      error.diff_match_patch_not_found = true;
      throw error;
    }
    cachedDiffPatch = {
      diff: function(txt1, txt2) {
        return instance.patch_toText(instance.patch_make(txt1, txt2));
      },
      patch: function(txt1, patch) {
        var results = instance.patch_apply(instance.patch_fromText(patch), txt1);
        for (var i = 0; i < results[1].length; i++) {
          if (!results[1][i]) {
            var error = new Error('text patch failed');
            error.textPatchFailed = true;
          }
        }
        return results[0];
      }
    };
  }
  return cachedDiffPatch;
};

var diffFilter = function textsDiffFilter(context) {
  if (context.leftType !== 'string') {
    return;
  }
  var minLength = (context.options && context.options.textDiff &&
    context.options.textDiff.minLength) || DEFAULT_MIN_LENGTH;
  if (context.left.length < minLength ||
    context.right.length < minLength) {
    context.setResult([context.left, context.right]).exit();
    return;
  }
  // large text, use a text-diff algorithm
  var diff = getDiffMatchPatch().diff;
  context.setResult([diff(context.left, context.right), 0, TEXT_DIFF]).exit();
};
diffFilter.filterName = 'texts';

var patchFilter = function textsPatchFilter(context) {
  if (context.nested) {
    return;
  }
  if (context.delta[2] !== TEXT_DIFF) {
    return;
  }

  // text-diff, use a text-patch algorithm
  var patch = getDiffMatchPatch().patch;
  context.setResult(patch(context.left, context.delta[0])).exit();
};
patchFilter.filterName = 'texts';

var textDeltaReverse = function(delta) {
  var i, l, lines, line, lineTmp, header = null,
    headerRegex = /^@@ +\-(\d+),(\d+) +\+(\d+),(\d+) +@@$/,
    lineHeader, lineAdd, lineRemove;
  lines = delta.split('\n');
  for (i = 0, l = lines.length; i < l; i++) {
    line = lines[i];
    var lineStart = line.slice(0, 1);
    if (lineStart === '@') {
      header = headerRegex.exec(line);
      lineHeader = i;
      lineAdd = null;
      lineRemove = null;

      // fix header
      lines[lineHeader] = '@@ -' + header[3] + ',' + header[4] + ' +' + header[1] + ',' + header[2] + ' @@';
    } else if (lineStart === '+') {
      lineAdd = i;
      lines[i] = '-' + lines[i].slice(1);
      if (lines[i - 1].slice(0, 1) === '+') {
        // swap lines to keep default order (-+)
        lineTmp = lines[i];
        lines[i] = lines[i - 1];
        lines[i - 1] = lineTmp;
      }
    } else if (lineStart === '-') {
      lineRemove = i;
      lines[i] = '+' + lines[i].slice(1);
    }
  }
  return lines.join('\n');
};

var reverseFilter = function textsReverseFilter(context) {
  if (context.nested) {
    return;
  }
  if (context.delta[2] !== TEXT_DIFF) {
    return;
  }

  // text-diff, use a text-diff algorithm
  context.setResult([textDeltaReverse(context.delta[0]), 0, TEXT_DIFF]).exit();
};
reverseFilter.filterName = 'texts';

exports.diffFilter = diffFilter;
exports.patchFilter = patchFilter;
exports.reverseFilter = reverseFilter;

},{}],20:[function(require,module,exports){
var isArray = (typeof Array.isArray === 'function') ?
  // use native function
  Array.isArray :
  // use instanceof operator
  function(a) {
    return a instanceof Array;
  };

var diffFilter = function trivialMatchesDiffFilter(context) {
  if (context.left === context.right) {
    context.setResult(undefined).exit();
    return;
  }
  if (typeof context.left === 'undefined') {
    if (typeof context.right === 'function') {
      throw new Error('functions are not supported');
    }
    context.setResult([context.right]).exit();
    return;
  }
  if (typeof context.right === 'undefined') {
    context.setResult([context.left, 0, 0]).exit();
    return;
  }
  if (typeof context.left === 'function' || typeof context.right === 'function') {
    throw new Error('functions are not supported');
  }
  context.leftType = context.left === null ? 'null' : typeof context.left;
  context.rightType = context.right === null ? 'null' : typeof context.right;
  if (context.leftType !== context.rightType) {
    context.setResult([context.left, context.right]).exit();
    return;
  }
  if (context.leftType === 'boolean' || context.leftType === 'number') {
    context.setResult([context.left, context.right]).exit();
    return;
  }
  if (context.leftType === 'object') {
    context.leftIsArray = isArray(context.left);
  }
  if (context.rightType === 'object') {
    context.rightIsArray = isArray(context.right);
  }
  if (context.leftIsArray !== context.rightIsArray) {
    context.setResult([context.left, context.right]).exit();
    return;
  }
};
diffFilter.filterName = 'trivial';

var patchFilter = function trivialMatchesPatchFilter(context) {
  if (typeof context.delta === 'undefined') {
    context.setResult(context.left).exit();
    return;
  }
  context.nested = !isArray(context.delta);
  if (context.nested) {
    return;
  }
  if (context.delta.length === 1) {
    context.setResult(context.delta[0]).exit();
    return;
  }
  if (context.delta.length === 2) {
    context.setResult(context.delta[1]).exit();
    return;
  }
  if (context.delta.length === 3 && context.delta[2] === 0) {
    context.setResult(undefined).exit();
    return;
  }
};
patchFilter.filterName = 'trivial';

var reverseFilter = function trivialReferseFilter(context) {
  if (typeof context.delta === 'undefined') {
    context.setResult(context.delta).exit();
    return;
  }
  context.nested = !isArray(context.delta);
  if (context.nested) {
    return;
  }
  if (context.delta.length === 1) {
    context.setResult([context.delta[0], 0, 0]).exit();
    return;
  }
  if (context.delta.length === 2) {
    context.setResult([context.delta[1], context.delta[0]]).exit();
    return;
  }
  if (context.delta.length === 3 && context.delta[2] === 0) {
    context.setResult([context.delta[0]]).exit();
    return;
  }
};
reverseFilter.filterName = 'trivial';

exports.diffFilter = diffFilter;
exports.patchFilter = patchFilter;
exports.reverseFilter = reverseFilter;

},{}],21:[function(require,module,exports){

var environment = require('./environment');

var DiffPatcher = require('./diffpatcher').DiffPatcher;
exports.DiffPatcher = DiffPatcher;

exports.create = function(options){
	return new DiffPatcher(options);
};

exports.dateReviver = require('./date-reviver');

var defaultInstance;

exports.diff = function() {
	if (!defaultInstance) {
		defaultInstance = new DiffPatcher();
	}
	return defaultInstance.diff.apply(defaultInstance, arguments);
};

exports.patch = function() {
	if (!defaultInstance) {
		defaultInstance = new DiffPatcher();
	}
	return defaultInstance.patch.apply(defaultInstance, arguments);
};

exports.unpatch = function() {
	if (!defaultInstance) {
		defaultInstance = new DiffPatcher();
	}
	return defaultInstance.unpatch.apply(defaultInstance, arguments);
};

exports.reverse = function() {
	if (!defaultInstance) {
		defaultInstance = new DiffPatcher();
	}
	return defaultInstance.reverse.apply(defaultInstance, arguments);
};

if (environment.isBrowser) {
	exports.homepage = 'https://github.com/benjamine/dialogo';
	exports.version = '0.0.2';
} else {
	var packageInfoModuleName = '../package.json';
	var packageInfo = require(packageInfoModuleName);
	exports.homepage = packageInfo.homepage;
	exports.version = packageInfo.version;

	var formatterModuleName = './formatters';
	var formatters = require(formatterModuleName);
	exports.formatters = formatters;
	// shortcut for console
	exports.console = formatters.console;
}

},{"./date-reviver":12,"./diffpatcher":13,"./environment":14}],22:[function(require,module,exports){
var Pipe = function Pipe(name) {
  this.name = name;
  this.filters = [];
};

Pipe.prototype.process = function(input) {
  if (!this.processor) {
    throw new Error('add this pipe to a processor before using it');
  }
  var debug = this.debug;
  var length = this.filters.length;
  var context = input;
  for (var index = 0; index < length; index++) {
    var filter = this.filters[index];
    if (debug) {
      this.log('filter: ' + filter.filterName);
    }
    filter(context);
    if (typeof context === 'object' && context.exiting) {
      context.exiting = false;
      break;
    }
  }
  if (!context.next && this.resultCheck) {
    this.resultCheck(context);
  }
};

Pipe.prototype.log = function(msg) {
  console.log('[jsondiffpatch] ' + this.name + ' pipe, ' + msg);
};

Pipe.prototype.append = function() {
  this.filters.push.apply(this.filters, arguments);
  return this;
};

Pipe.prototype.prepend = function() {
  this.filters.unshift.apply(this.filters, arguments);
  return this;
};

Pipe.prototype.indexOf = function(filterName) {
  if (!filterName) {
    throw new Error('a filter name is required');
  }
  for (var index = 0; index < this.filters.length; index++) {
    var filter = this.filters[index];
    if (filter.filterName === filterName) {
      return index;
    }
  }
  throw new Error('filter not found: ' + filterName);
};

Pipe.prototype.list = function() {
  var names = [];
  for (var index = 0; index < this.filters.length; index++) {
    var filter = this.filters[index];
    names.push(filter.filterName);
  }
  return names;
};

Pipe.prototype.after = function(filterName) {
  var index = this.indexOf(filterName);
  var params = Array.prototype.slice.call(arguments, 1);
  if (!params.length) {
    throw new Error('a filter is required');
  }
  params.unshift(index + 1, 0);
  Array.prototype.splice.apply(this.filters, params);
  return this;
};

Pipe.prototype.before = function(filterName) {
  var index = this.indexOf(filterName);
  var params = Array.prototype.slice.call(arguments, 1);
  if (!params.length) {
    throw new Error('a filter is required');
  }
  params.unshift(index, 0);
  Array.prototype.splice.apply(this.filters, params);
  return this;
};

Pipe.prototype.clear = function() {
  this.filters.length = 0;
  return this;
};

Pipe.prototype.shouldHaveResult = function(should) {
  if (should === false) {
    this.resultCheck = null;
    return;
  }
  if (this.resultCheck) {
    return;
  }
  var pipe = this;
  this.resultCheck = function(context) {
    if (!context.hasResult) {
      console.log(context);
      var error = new Error(pipe.name + ' failed');
      error.noResult = true;
      throw error;
    }
  };
  return this;
};

exports.Pipe = Pipe;

},{}],23:[function(require,module,exports){

var Processor = function Processor(options){
	this.selfOptions = options;
	this.pipes = {};
};

Processor.prototype.options = function(options) {
	if (options) {
		this.selfOptions = options;
	}
	return this.selfOptions;
};

Processor.prototype.pipe = function(name, pipe) {
	if (typeof name === 'string') {
		if (typeof pipe === 'undefined') {
			return this.pipes[name];
		} else {
			this.pipes[name] = pipe;
		}
	}
	if (name && name.name) {
		pipe = name;
		if (pipe.processor === this) { return pipe; }
		this.pipes[pipe.name] = pipe;
	}
	pipe.processor = this;
	return pipe;
};

Processor.prototype.process = function(input, pipe) {
	var context = input;
	context.options = this.options();
	var nextPipe = pipe || input.pipe || 'default';
	var lastPipe, lastContext;
	while (nextPipe) {
		if (typeof context.nextAfterChildren !== 'undefined') {
			// children processed and coming back to parent
			context.next = context.nextAfterChildren;
			context.nextAfterChildren = null;
		}

		if (typeof nextPipe === 'string') {
			nextPipe = this.pipe(nextPipe);
		}
		nextPipe.process(context);
		lastContext = context;
		lastPipe = nextPipe;
		nextPipe = null;
		if (context) {
			if (context.next) {
				context = context.next;
				nextPipe = lastContext.nextPipe || context.pipe || lastPipe;
			}
		}
	}
	return context.hasResult ? context.result : undefined;
};

exports.Processor = Processor;

},{}],24:[function(require,module,exports){
var jsondiffpatch = require('jsondiffpatch');

function Doc(root, version) {
  this.root = typeof root === 'undefined' ? null : root;
  this.version = version || 0;
}

Doc.prototype.clone = function () {
  var doc = new Doc(
    JSON.parse(JSON.stringify(this.root), jsondiffpatch.dateReviver),
    this.version
  );
  doc.url = this.url;
  return doc;
};

Doc.empty = new Doc(null, 0);
Doc.empty.isEmpty = true;

Doc.notFound = new Doc(null, 0);
Doc.notFound.notFound = true;

exports.Doc = Doc;

},{"jsondiffpatch":21}],25:[function(require,module,exports){
(function (process){
var util = require('util');
var events = require('events');
var jsondiffpatch = require('jsondiffpatch');
var jsondiffpatch = require('jsondiffpatch');
if (process.browser) {
  /* jshint ignore: start */
  window.diff_match_patch = window.diff_match_patch || require('jsondiffpatch/public/external/diff_match_patch_uncompressed');
  /* jshint ignore: end */
}

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
  this.watch();
  this.emit('sync');
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

}).call(this,require('_process'))

},{"./doc":24,"_process":4,"events":2,"jsondiffpatch":21,"jsondiffpatch/public/external/diff_match_patch_uncompressed":7,"util":6}],26:[function(require,module,exports){

var Doc = require('./doc').Doc;

function Storage(documents) {
  // base implementation is in-memory
  this.documents = documents || {};
}

Storage.prototype.get = function (url, options, callback) {
  if (!this.documents || !this.documents[url]) {
    if (!options || !options.create) {
      var err = new Error('document not found');
      err.notFound = true;
      err.url = url;
      callback(err);
      return;
    }
    this.documents[url] = {};
  }
  var doc = this.documents[url];
  if (!(doc instanceof Doc)) {
    doc = this.documents[url] = new Doc(doc);
  }
  doc.url = url;
  callback(null, doc);
};

Storage.prototype.put = function (url, doc, options, callback) {
  if (!this.documents) {
    this.documents = {};
  }
  if (!(doc instanceof Doc)) {
    doc = new Doc(doc);
  }
  doc.url = url;
  this.documents[url] = doc.clone();
  callback(null, url);
};

exports.Storage = Storage;

},{"./doc":24}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9maWJlcmdsYXNzL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvbWFpbi5qcyIsIm5vZGVfbW9kdWxlcy9maWJlcmdsYXNzL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9ldmVudHMvZXZlbnRzLmpzIiwibm9kZV9tb2R1bGVzL2ZpYmVyZ2xhc3Mvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvZmliZXJnbGFzcy9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2ZpYmVyZ2xhc3Mvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvZmliZXJnbGFzcy9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvdXRpbC91dGlsLmpzIiwibm9kZV9tb2R1bGVzL2pzb25kaWZmcGF0Y2gvcHVibGljL2V4dGVybmFsL2RpZmZfbWF0Y2hfcGF0Y2hfdW5jb21wcmVzc2VkLmpzIiwibm9kZV9tb2R1bGVzL2pzb25kaWZmcGF0Y2gvc3JjL2NvbnRleHRzL2NvbnRleHQuanMiLCJub2RlX21vZHVsZXMvanNvbmRpZmZwYXRjaC9zcmMvY29udGV4dHMvZGlmZi5qcyIsIm5vZGVfbW9kdWxlcy9qc29uZGlmZnBhdGNoL3NyYy9jb250ZXh0cy9wYXRjaC5qcyIsIm5vZGVfbW9kdWxlcy9qc29uZGlmZnBhdGNoL3NyYy9jb250ZXh0cy9yZXZlcnNlLmpzIiwibm9kZV9tb2R1bGVzL2pzb25kaWZmcGF0Y2gvc3JjL2RhdGUtcmV2aXZlci5qcyIsIm5vZGVfbW9kdWxlcy9qc29uZGlmZnBhdGNoL3NyYy9kaWZmcGF0Y2hlci5qcyIsIm5vZGVfbW9kdWxlcy9qc29uZGlmZnBhdGNoL3NyYy9lbnZpcm9ubWVudC5qcyIsIm5vZGVfbW9kdWxlcy9qc29uZGlmZnBhdGNoL3NyYy9maWx0ZXJzL2FycmF5cy5qcyIsIm5vZGVfbW9kdWxlcy9qc29uZGlmZnBhdGNoL3NyYy9maWx0ZXJzL2RhdGVzLmpzIiwibm9kZV9tb2R1bGVzL2pzb25kaWZmcGF0Y2gvc3JjL2ZpbHRlcnMvbGNzLmpzIiwibm9kZV9tb2R1bGVzL2pzb25kaWZmcGF0Y2gvc3JjL2ZpbHRlcnMvbmVzdGVkLmpzIiwibm9kZV9tb2R1bGVzL2pzb25kaWZmcGF0Y2gvc3JjL2ZpbHRlcnMvdGV4dHMuanMiLCJub2RlX21vZHVsZXMvanNvbmRpZmZwYXRjaC9zcmMvZmlsdGVycy90cml2aWFsLmpzIiwibm9kZV9tb2R1bGVzL2pzb25kaWZmcGF0Y2gvc3JjL21haW4uanMiLCJub2RlX21vZHVsZXMvanNvbmRpZmZwYXRjaC9zcmMvcGlwZS5qcyIsIm5vZGVfbW9kdWxlcy9qc29uZGlmZnBhdGNoL3NyYy9wcm9jZXNzb3IuanMiLCJzcmMvZG9jLmpzIiwic3JjL3BlZXIuanMiLCJzcmMvc3RvcmFnZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDL2NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXG52YXIgRG9jID0gcmVxdWlyZSgnLi9kb2MnKS5Eb2M7XG52YXIgUGVlciA9IHJlcXVpcmUoJy4vcGVlcicpLlBlZXI7XG52YXIgU3RvcmFnZSA9IHJlcXVpcmUoJy4vc3RvcmFnZScpLlN0b3JhZ2U7XG5cbmV4cG9ydHMuRG9jID0gRG9jO1xuZXhwb3J0cy5QZWVyID0gUGVlcjtcbmV4cG9ydHMuU3RvcmFnZSA9IFN0b3JhZ2U7XG5leHBvcnRzLmpzb25kaWZmcGF0Y2ggPSByZXF1aXJlKCdqc29uZGlmZnBhdGNoJyk7XG5cbnZhciBpbk5vZGUgPSB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHByb2Nlc3MuZXhlY1BhdGggPT09ICdzdHJpbmcnO1xuaWYgKCFpbk5vZGUpIHtcblx0ZXhwb3J0cy5ob21lcGFnZSA9ICd7e3BhY2thZ2UtaG9tZXBhZ2V9fSc7XG5cdGV4cG9ydHMudmVyc2lvbiA9ICd7e3BhY2thZ2UtdmVyc2lvbn19Jztcbn1cbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IHRoaXMuX2V2ZW50cyB8fCB7fTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gdGhpcy5fbWF4TGlzdGVuZXJzIHx8IHVuZGVmaW5lZDtcbn1cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjEwLnhcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX21heExpc3RlbmVycyA9IHVuZGVmaW5lZDtcblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnMgYXJlXG4vLyBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIWlzTnVtYmVyKG4pIHx8IG4gPCAwIHx8IGlzTmFOKG4pKVxuICAgIHRocm93IFR5cGVFcnJvcignbiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgZXIsIGhhbmRsZXIsIGxlbiwgYXJncywgaSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAoaXNPYmplY3QodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpIHtcbiAgICAgIGVyID0gYXJndW1lbnRzWzFdO1xuICAgICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoJ1VuY2F1Z2h0LCB1bnNwZWNpZmllZCBcImVycm9yXCIgZXZlbnQuJyk7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNVbmRlZmluZWQoaGFuZGxlcikpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QoaGFuZGxlcikpIHtcbiAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG5cbiAgICBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICBpZiAodGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKVxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICBpc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2VcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG5cbiAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkgJiYgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICB2YXIgbTtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZS50cmFjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBub3Qgc3VwcG9ydGVkIGluIElFIDEwXG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgdmFyIGZpcmVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZygpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuXG4gICAgaWYgKCFmaXJlZCkge1xuICAgICAgZmlyZWQgPSB0cnVlO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHRoaXMub24odHlwZSwgZyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBlbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWZmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZFxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBsaXN0LCBwb3NpdGlvbiwgbGVuZ3RoLCBpO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGxlbmd0aCA9IGxpc3QubGVuZ3RoO1xuICBwb3NpdGlvbiA9IC0xO1xuXG4gIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fFxuICAgICAgKGlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGxpc3QpKSB7XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gPiAwOykge1xuICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGxpc3RbaV0ubGlzdGVuZXIgJiYgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIga2V5LCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICBpZiAoIXRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGZvciAoa2V5IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNGdW5jdGlvbihsaXN0ZW5lcnMpKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICB9IGVsc2Uge1xuICAgIC8vIExJRk8gb3JkZXJcbiAgICB3aGlsZSAobGlzdGVuZXJzLmxlbmd0aClcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2xpc3RlbmVycy5sZW5ndGggLSAxXSk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IFtdO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIWVtaXR0ZXIuX2V2ZW50cyB8fCAhZW1pdHRlci5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IDA7XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24oZW1pdHRlci5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSAxO1xuICBlbHNlXG4gICAgcmV0ID0gZW1pdHRlci5fZXZlbnRzW3R5cGVdLmxlbmd0aDtcbiAgcmV0dXJuIHJldDtcbn07XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbiIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQnVmZmVyKGFyZykge1xuICByZXR1cm4gYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnXG4gICAgJiYgdHlwZW9mIGFyZy5jb3B5ID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5maWxsID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5yZWFkVUludDggPT09ICdmdW5jdGlvbic7XG59IiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICghaXNTdHJpbmcoZikpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICByZXR1cm4gJ1tDaXJjdWxhcl0nO1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IgKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSkge1xuICAgIGlmIChpc051bGwoeCkgfHwgIWlzT2JqZWN0KHgpKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuXG5cbi8vIE1hcmsgdGhhdCBhIG1ldGhvZCBzaG91bGQgbm90IGJlIHVzZWQuXG4vLyBSZXR1cm5zIGEgbW9kaWZpZWQgZnVuY3Rpb24gd2hpY2ggd2FybnMgb25jZSBieSBkZWZhdWx0LlxuLy8gSWYgLS1uby1kZXByZWNhdGlvbiBpcyBzZXQsIHRoZW4gaXQgaXMgYSBuby1vcC5cbmV4cG9ydHMuZGVwcmVjYXRlID0gZnVuY3Rpb24oZm4sIG1zZykge1xuICAvLyBBbGxvdyBmb3IgZGVwcmVjYXRpbmcgdGhpbmdzIGluIHRoZSBwcm9jZXNzIG9mIHN0YXJ0aW5nIHVwLlxuICBpZiAoaXNVbmRlZmluZWQoZ2xvYmFsLnByb2Nlc3MpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGV4cG9ydHMuZGVwcmVjYXRlKGZuLCBtc2cpLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLm5vRGVwcmVjYXRpb24gPT09IHRydWUpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICB2YXIgd2FybmVkID0gZmFsc2U7XG4gIGZ1bmN0aW9uIGRlcHJlY2F0ZWQoKSB7XG4gICAgaWYgKCF3YXJuZWQpIHtcbiAgICAgIGlmIChwcm9jZXNzLnRocm93RGVwcmVjYXRpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgICB9IGVsc2UgaWYgKHByb2Nlc3MudHJhY2VEZXByZWNhdGlvbikge1xuICAgICAgICBjb25zb2xlLnRyYWNlKG1zZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgICB9XG4gICAgICB3YXJuZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIHJldHVybiBkZXByZWNhdGVkO1xufTtcblxuXG52YXIgZGVidWdzID0ge307XG52YXIgZGVidWdFbnZpcm9uO1xuZXhwb3J0cy5kZWJ1Z2xvZyA9IGZ1bmN0aW9uKHNldCkge1xuICBpZiAoaXNVbmRlZmluZWQoZGVidWdFbnZpcm9uKSlcbiAgICBkZWJ1Z0Vudmlyb24gPSBwcm9jZXNzLmVudi5OT0RFX0RFQlVHIHx8ICcnO1xuICBzZXQgPSBzZXQudG9VcHBlckNhc2UoKTtcbiAgaWYgKCFkZWJ1Z3Nbc2V0XSkge1xuICAgIGlmIChuZXcgUmVnRXhwKCdcXFxcYicgKyBzZXQgKyAnXFxcXGInLCAnaScpLnRlc3QoZGVidWdFbnZpcm9uKSkge1xuICAgICAgdmFyIHBpZCA9IHByb2Nlc3MucGlkO1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1zZyA9IGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJyVzICVkOiAlcycsIHNldCwgcGlkLCBtc2cpO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHt9O1xuICAgIH1cbiAgfVxuICByZXR1cm4gZGVidWdzW3NldF07XG59O1xuXG5cbi8qKlxuICogRWNob3MgdGhlIHZhbHVlIG9mIGEgdmFsdWUuIFRyeXMgdG8gcHJpbnQgdGhlIHZhbHVlIG91dFxuICogaW4gdGhlIGJlc3Qgd2F5IHBvc3NpYmxlIGdpdmVuIHRoZSBkaWZmZXJlbnQgdHlwZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHByaW50IG91dC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0IHRoYXQgYWx0ZXJzIHRoZSBvdXRwdXQuXG4gKi9cbi8qIGxlZ2FjeTogb2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKi9cbmZ1bmN0aW9uIGluc3BlY3Qob2JqLCBvcHRzKSB7XG4gIC8vIGRlZmF1bHQgb3B0aW9uc1xuICB2YXIgY3R4ID0ge1xuICAgIHNlZW46IFtdLFxuICAgIHN0eWxpemU6IHN0eWxpemVOb0NvbG9yXG4gIH07XG4gIC8vIGxlZ2FjeS4uLlxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSBjdHguZGVwdGggPSBhcmd1bWVudHNbMl07XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDQpIGN0eC5jb2xvcnMgPSBhcmd1bWVudHNbM107XG4gIGlmIChpc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAvLyBsZWdhY3kuLi5cbiAgICBjdHguc2hvd0hpZGRlbiA9IG9wdHM7XG4gIH0gZWxzZSBpZiAob3B0cykge1xuICAgIC8vIGdvdCBhbiBcIm9wdGlvbnNcIiBvYmplY3RcbiAgICBleHBvcnRzLl9leHRlbmQoY3R4LCBvcHRzKTtcbiAgfVxuICAvLyBzZXQgZGVmYXVsdCBvcHRpb25zXG4gIGlmIChpc1VuZGVmaW5lZChjdHguc2hvd0hpZGRlbikpIGN0eC5zaG93SGlkZGVuID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguZGVwdGgpKSBjdHguZGVwdGggPSAyO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmNvbG9ycykpIGN0eC5jb2xvcnMgPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jdXN0b21JbnNwZWN0KSkgY3R4LmN1c3RvbUluc3BlY3QgPSB0cnVlO1xuICBpZiAoY3R4LmNvbG9ycykgY3R4LnN0eWxpemUgPSBzdHlsaXplV2l0aENvbG9yO1xuICByZXR1cm4gZm9ybWF0VmFsdWUoY3R4LCBvYmosIGN0eC5kZXB0aCk7XG59XG5leHBvcnRzLmluc3BlY3QgPSBpbnNwZWN0O1xuXG5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuaW5zcGVjdC5jb2xvcnMgPSB7XG4gICdib2xkJyA6IFsxLCAyMl0sXG4gICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICdncmV5JyA6IFs5MCwgMzldLFxuICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICdibHVlJyA6IFszNCwgMzldLFxuICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgJ3llbGxvdycgOiBbMzMsIDM5XVxufTtcblxuLy8gRG9uJ3QgdXNlICdibHVlJyBub3QgdmlzaWJsZSBvbiBjbWQuZXhlXG5pbnNwZWN0LnN0eWxlcyA9IHtcbiAgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICdudW1iZXInOiAneWVsbG93JyxcbiAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgJ251bGwnOiAnYm9sZCcsXG4gICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgJ3JlZ2V4cCc6ICdyZWQnXG59O1xuXG5cbmZ1bmN0aW9uIHN0eWxpemVXaXRoQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgdmFyIHN0eWxlID0gaW5zcGVjdC5zdHlsZXNbc3R5bGVUeXBlXTtcblxuICBpZiAoc3R5bGUpIHtcbiAgICByZXR1cm4gJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMV0gKyAnbSc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHN0eWxpemVOb0NvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHJldHVybiBzdHI7XG59XG5cblxuZnVuY3Rpb24gYXJyYXlUb0hhc2goYXJyYXkpIHtcbiAgdmFyIGhhc2ggPSB7fTtcblxuICBhcnJheS5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaWR4KSB7XG4gICAgaGFzaFt2YWxdID0gdHJ1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGhhc2g7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0VmFsdWUoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gIGlmIChjdHguY3VzdG9tSW5zcGVjdCAmJlxuICAgICAgdmFsdWUgJiZcbiAgICAgIGlzRnVuY3Rpb24odmFsdWUuaW5zcGVjdCkgJiZcbiAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgdmFsdWUuaW5zcGVjdCAhPT0gZXhwb3J0cy5pbnNwZWN0ICYmXG4gICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICB2YXIgcmV0ID0gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMsIGN0eCk7XG4gICAgaWYgKCFpc1N0cmluZyhyZXQpKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcbiAgdmFyIHZpc2libGVLZXlzID0gYXJyYXlUb0hhc2goa2V5cyk7XG5cbiAgaWYgKGN0eC5zaG93SGlkZGVuKSB7XG4gICAga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgfVxuXG4gIC8vIElFIGRvZXNuJ3QgbWFrZSBlcnJvciBmaWVsZHMgbm9uLWVudW1lcmFibGVcbiAgLy8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2llL2R3dzUyc2J0KHY9dnMuOTQpLmFzcHhcbiAgaWYgKGlzRXJyb3IodmFsdWUpXG4gICAgICAmJiAoa2V5cy5pbmRleE9mKCdtZXNzYWdlJykgPj0gMCB8fCBrZXlzLmluZGV4T2YoJ2Rlc2NyaXB0aW9uJykgPj0gMCkpIHtcbiAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgLy8gU29tZSB0eXBlIG9mIG9iamVjdCB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH1cbiAgICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAnZGF0ZScpO1xuICAgIH1cbiAgICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGJhc2UgPSAnJywgYXJyYXkgPSBmYWxzZSwgYnJhY2VzID0gWyd7JywgJ30nXTtcblxuICAvLyBNYWtlIEFycmF5IHNheSB0aGF0IHRoZXkgYXJlIEFycmF5XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGFycmF5ID0gdHJ1ZTtcbiAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICB9XG5cbiAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIHZhciBuID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgYmFzZSA9ICcgW0Z1bmN0aW9uJyArIG4gKyAnXSc7XG4gIH1cblxuICAvLyBNYWtlIFJlZ0V4cHMgc2F5IHRoYXQgdGhleSBhcmUgUmVnRXhwc1xuICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGRhdGVzIHdpdGggcHJvcGVydGllcyBmaXJzdCBzYXkgdGhlIGRhdGVcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgRGF0ZS5wcm90b3R5cGUudG9VVENTdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGVycm9yIHdpdGggbWVzc2FnZSBmaXJzdCBzYXkgdGhlIGVycm9yXG4gIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICBpZiAoa2V5cy5sZW5ndGggPT09IDAgJiYgKCFhcnJheSB8fCB2YWx1ZS5sZW5ndGggPT0gMCkpIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArIGJyYWNlc1sxXTtcbiAgfVxuXG4gIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG5cbiAgY3R4LnNlZW4ucHVzaCh2YWx1ZSk7XG5cbiAgdmFyIG91dHB1dDtcbiAgaWYgKGFycmF5KSB7XG4gICAgb3V0cHV0ID0gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cyk7XG4gIH0gZWxzZSB7XG4gICAgb3V0cHV0ID0ga2V5cy5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBjdHguc2Vlbi5wb3AoKTtcblxuICByZXR1cm4gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKSB7XG4gIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG4gIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcbiAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG4gIH1cbiAgaWYgKGlzTnVtYmVyKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuICBpZiAoaXNCb29sZWFuKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICBpZiAoaXNOdWxsKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEVycm9yKHZhbHVlKSB7XG4gIHJldHVybiAnWycgKyBFcnJvci5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgKyAnXSc7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cykge1xuICB2YXIgb3V0cHV0ID0gW107XG4gIGZvciAodmFyIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgaWYgKGhhc093blByb3BlcnR5KHZhbHVlLCBTdHJpbmcoaSkpKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIFN0cmluZyhpKSwgdHJ1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaCgnJyk7XG4gICAgfVxuICB9XG4gIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIWtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAga2V5LCB0cnVlKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KSB7XG4gIHZhciBuYW1lLCBzdHIsIGRlc2M7XG4gIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpIHx8IHsgdmFsdWU6IHZhbHVlW2tleV0gfTtcbiAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoIWhhc093blByb3BlcnR5KHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChjdHguc2Vlbi5pbmRleE9mKGRlc2MudmFsdWUpIDwgMCkge1xuICAgICAgaWYgKGlzTnVsbChyZWN1cnNlVGltZXMpKSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgfVxuICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgIGlmIChhcnJheSkge1xuICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzVW5kZWZpbmVkKG5hbWUpKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xufVxuXG5cbmZ1bmN0aW9uIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKSB7XG4gIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgIG51bUxpbmVzRXN0Kys7XG4gICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgIHJldHVybiBwcmV2ICsgY3VyLnJlcGxhY2UoL1xcdTAwMWJcXFtcXGRcXGQ/bS9nLCAnJykubGVuZ3RoICsgMTtcbiAgfSwgMCk7XG5cbiAgaWYgKGxlbmd0aCA+IDYwKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArXG4gICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBicmFjZXNbMV07XG4gIH1cblxuICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xufVxuXG5cbi8vIE5PVEU6IFRoZXNlIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25zIGludGVudGlvbmFsbHkgZG9uJ3QgdXNlIGBpbnN0YW5jZW9mYFxuLy8gYmVjYXVzZSBpdCBpcyBmcmFnaWxlIGFuZCBjYW4gYmUgZWFzaWx5IGZha2VkIHdpdGggYE9iamVjdC5jcmVhdGUoKWAuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGFyKTtcbn1cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJztcbn1cbmV4cG9ydHMuaXNCb29sZWFuID0gaXNCb29sZWFuO1xuXG5mdW5jdGlvbiBpc051bGwoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbCA9IGlzTnVsbDtcblxuZnVuY3Rpb24gaXNOdWxsT3JVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsT3JVbmRlZmluZWQgPSBpc051bGxPclVuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cbmV4cG9ydHMuaXNOdW1iZXIgPSBpc051bWJlcjtcblxuZnVuY3Rpb24gaXNTdHJpbmcoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJztcbn1cbmV4cG9ydHMuaXNTdHJpbmcgPSBpc1N0cmluZztcblxuZnVuY3Rpb24gaXNTeW1ib2woYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3ltYm9sJztcbn1cbmV4cG9ydHMuaXNTeW1ib2wgPSBpc1N5bWJvbDtcblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbmV4cG9ydHMuaXNVbmRlZmluZWQgPSBpc1VuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHJlKSAmJiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuZXhwb3J0cy5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNPYmplY3QgPSBpc09iamVjdDtcblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGQpICYmIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5leHBvcnRzLmlzRGF0ZSA9IGlzRGF0ZTtcblxuZnVuY3Rpb24gaXNFcnJvcihlKSB7XG4gIHJldHVybiBpc09iamVjdChlKSAmJlxuICAgICAgKG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nIHx8IGUgaW5zdGFuY2VvZiBFcnJvcik7XG59XG5leHBvcnRzLmlzRXJyb3IgPSBpc0Vycm9yO1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnYm9vbGVhbicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdudW1iZXInIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCcgfHwgIC8vIEVTNiBzeW1ib2xcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICd1bmRlZmluZWQnO1xufVxuZXhwb3J0cy5pc1ByaW1pdGl2ZSA9IGlzUHJpbWl0aXZlO1xuXG5leHBvcnRzLmlzQnVmZmVyID0gcmVxdWlyZSgnLi9zdXBwb3J0L2lzQnVmZmVyJyk7XG5cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKG8pIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKTtcbn1cblxuXG5mdW5jdGlvbiBwYWQobikge1xuICByZXR1cm4gbiA8IDEwID8gJzAnICsgbi50b1N0cmluZygxMCkgOiBuLnRvU3RyaW5nKDEwKTtcbn1cblxuXG52YXIgbW9udGhzID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsXG4gICAgICAgICAgICAgICdPY3QnLCAnTm92JywgJ0RlYyddO1xuXG4vLyAyNiBGZWIgMTY6MTk6MzRcbmZ1bmN0aW9uIHRpbWVzdGFtcCgpIHtcbiAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICB2YXIgdGltZSA9IFtwYWQoZC5nZXRIb3VycygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0TWludXRlcygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0U2Vjb25kcygpKV0uam9pbignOicpO1xuICByZXR1cm4gW2QuZ2V0RGF0ZSgpLCBtb250aHNbZC5nZXRNb250aCgpXSwgdGltZV0uam9pbignICcpO1xufVxuXG5cbi8vIGxvZyBpcyBqdXN0IGEgdGhpbiB3cmFwcGVyIHRvIGNvbnNvbGUubG9nIHRoYXQgcHJlcGVuZHMgYSB0aW1lc3RhbXBcbmV4cG9ydHMubG9nID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKCclcyAtICVzJywgdGltZXN0YW1wKCksIGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cykpO1xufTtcblxuXG4vKipcbiAqIEluaGVyaXQgdGhlIHByb3RvdHlwZSBtZXRob2RzIGZyb20gb25lIGNvbnN0cnVjdG9yIGludG8gYW5vdGhlci5cbiAqXG4gKiBUaGUgRnVuY3Rpb24ucHJvdG90eXBlLmluaGVyaXRzIGZyb20gbGFuZy5qcyByZXdyaXR0ZW4gYXMgYSBzdGFuZGFsb25lXG4gKiBmdW5jdGlvbiAobm90IG9uIEZ1bmN0aW9uLnByb3RvdHlwZSkuIE5PVEU6IElmIHRoaXMgZmlsZSBpcyB0byBiZSBsb2FkZWRcbiAqIGR1cmluZyBib290c3RyYXBwaW5nIHRoaXMgZnVuY3Rpb24gbmVlZHMgdG8gYmUgcmV3cml0dGVuIHVzaW5nIHNvbWUgbmF0aXZlXG4gKiBmdW5jdGlvbnMgYXMgcHJvdG90eXBlIHNldHVwIHVzaW5nIG5vcm1hbCBKYXZhU2NyaXB0IGRvZXMgbm90IHdvcmsgYXNcbiAqIGV4cGVjdGVkIGR1cmluZyBib290c3RyYXBwaW5nIChzZWUgbWlycm9yLmpzIGluIHIxMTQ5MDMpLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gd2hpY2ggbmVlZHMgdG8gaW5oZXJpdCB0aGVcbiAqICAgICBwcm90b3R5cGUuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBzdXBlckN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gdG8gaW5oZXJpdCBwcm90b3R5cGUgZnJvbS5cbiAqL1xuZXhwb3J0cy5pbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XG5cbmV4cG9ydHMuX2V4dGVuZCA9IGZ1bmN0aW9uKG9yaWdpbiwgYWRkKSB7XG4gIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIGFkZCBpc24ndCBhbiBvYmplY3RcbiAgaWYgKCFhZGQgfHwgIWlzT2JqZWN0KGFkZCkpIHJldHVybiBvcmlnaW47XG5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dO1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59O1xuXG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuIiwiLyoqXG4gKiBEaWZmIE1hdGNoIGFuZCBQYXRjaFxuICpcbiAqIENvcHlyaWdodCAyMDA2IEdvb2dsZSBJbmMuXG4gKiBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvZ29vZ2xlLWRpZmYtbWF0Y2gtcGF0Y2gvXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29tcHV0ZXMgdGhlIGRpZmZlcmVuY2UgYmV0d2VlbiB0d28gdGV4dHMgdG8gY3JlYXRlIGEgcGF0Y2guXG4gKiBBcHBsaWVzIHRoZSBwYXRjaCBvbnRvIGFub3RoZXIgdGV4dCwgYWxsb3dpbmcgZm9yIGVycm9ycy5cbiAqIEBhdXRob3IgZnJhc2VyQGdvb2dsZS5jb20gKE5laWwgRnJhc2VyKVxuICovXG5cbi8qKlxuICogQ2xhc3MgY29udGFpbmluZyB0aGUgZGlmZiwgbWF0Y2ggYW5kIHBhdGNoIG1ldGhvZHMuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gZGlmZl9tYXRjaF9wYXRjaCgpIHtcblxuICAvLyBEZWZhdWx0cy5cbiAgLy8gUmVkZWZpbmUgdGhlc2UgaW4geW91ciBwcm9ncmFtIHRvIG92ZXJyaWRlIHRoZSBkZWZhdWx0cy5cblxuICAvLyBOdW1iZXIgb2Ygc2Vjb25kcyB0byBtYXAgYSBkaWZmIGJlZm9yZSBnaXZpbmcgdXAgKDAgZm9yIGluZmluaXR5KS5cbiAgdGhpcy5EaWZmX1RpbWVvdXQgPSAxLjA7XG4gIC8vIENvc3Qgb2YgYW4gZW1wdHkgZWRpdCBvcGVyYXRpb24gaW4gdGVybXMgb2YgZWRpdCBjaGFyYWN0ZXJzLlxuICB0aGlzLkRpZmZfRWRpdENvc3QgPSA0O1xuICAvLyBBdCB3aGF0IHBvaW50IGlzIG5vIG1hdGNoIGRlY2xhcmVkICgwLjAgPSBwZXJmZWN0aW9uLCAxLjAgPSB2ZXJ5IGxvb3NlKS5cbiAgdGhpcy5NYXRjaF9UaHJlc2hvbGQgPSAwLjU7XG4gIC8vIEhvdyBmYXIgdG8gc2VhcmNoIGZvciBhIG1hdGNoICgwID0gZXhhY3QgbG9jYXRpb24sIDEwMDArID0gYnJvYWQgbWF0Y2gpLlxuICAvLyBBIG1hdGNoIHRoaXMgbWFueSBjaGFyYWN0ZXJzIGF3YXkgZnJvbSB0aGUgZXhwZWN0ZWQgbG9jYXRpb24gd2lsbCBhZGRcbiAgLy8gMS4wIHRvIHRoZSBzY29yZSAoMC4wIGlzIGEgcGVyZmVjdCBtYXRjaCkuXG4gIHRoaXMuTWF0Y2hfRGlzdGFuY2UgPSAxMDAwO1xuICAvLyBXaGVuIGRlbGV0aW5nIGEgbGFyZ2UgYmxvY2sgb2YgdGV4dCAob3ZlciB+NjQgY2hhcmFjdGVycyksIGhvdyBjbG9zZSBkb2VzXG4gIC8vIHRoZSBjb250ZW50cyBoYXZlIHRvIG1hdGNoIHRoZSBleHBlY3RlZCBjb250ZW50cy4gKDAuMCA9IHBlcmZlY3Rpb24sXG4gIC8vIDEuMCA9IHZlcnkgbG9vc2UpLiAgTm90ZSB0aGF0IE1hdGNoX1RocmVzaG9sZCBjb250cm9scyBob3cgY2xvc2VseSB0aGVcbiAgLy8gZW5kIHBvaW50cyBvZiBhIGRlbGV0ZSBuZWVkIHRvIG1hdGNoLlxuICB0aGlzLlBhdGNoX0RlbGV0ZVRocmVzaG9sZCA9IDAuNTtcbiAgLy8gQ2h1bmsgc2l6ZSBmb3IgY29udGV4dCBsZW5ndGguXG4gIHRoaXMuUGF0Y2hfTWFyZ2luID0gNDtcblxuICAvLyBUaGUgbnVtYmVyIG9mIGJpdHMgaW4gYW4gaW50LlxuICB0aGlzLk1hdGNoX01heEJpdHMgPSAzMjtcbn1cblxuXG4vLyAgRElGRiBGVU5DVElPTlNcblxuXG4vKipcbiAqIFRoZSBkYXRhIHN0cnVjdHVyZSByZXByZXNlbnRpbmcgYSBkaWZmIGlzIGFuIGFycmF5IG9mIHR1cGxlczpcbiAqIFtbRElGRl9ERUxFVEUsICdIZWxsbyddLCBbRElGRl9JTlNFUlQsICdHb29kYnllJ10sIFtESUZGX0VRVUFMLCAnIHdvcmxkLiddXVxuICogd2hpY2ggbWVhbnM6IGRlbGV0ZSAnSGVsbG8nLCBhZGQgJ0dvb2RieWUnIGFuZCBrZWVwICcgd29ybGQuJ1xuICovXG52YXIgRElGRl9ERUxFVEUgPSAtMTtcbnZhciBESUZGX0lOU0VSVCA9IDE7XG52YXIgRElGRl9FUVVBTCA9IDA7XG5cbi8qKiBAdHlwZWRlZiB7IUFycmF5LjxudW1iZXJ8c3RyaW5nPn0gKi9cbmRpZmZfbWF0Y2hfcGF0Y2guRGlmZjtcblxuXG4vKipcbiAqIEZpbmQgdGhlIGRpZmZlcmVuY2VzIGJldHdlZW4gdHdvIHRleHRzLiAgU2ltcGxpZmllcyB0aGUgcHJvYmxlbSBieSBzdHJpcHBpbmdcbiAqIGFueSBjb21tb24gcHJlZml4IG9yIHN1ZmZpeCBvZmYgdGhlIHRleHRzIGJlZm9yZSBkaWZmaW5nLlxuICogQHBhcmFtIHtzdHJpbmd9IHRleHQxIE9sZCBzdHJpbmcgdG8gYmUgZGlmZmVkLlxuICogQHBhcmFtIHtzdHJpbmd9IHRleHQyIE5ldyBzdHJpbmcgdG8gYmUgZGlmZmVkLlxuICogQHBhcmFtIHtib29sZWFuPX0gb3B0X2NoZWNrbGluZXMgT3B0aW9uYWwgc3BlZWR1cCBmbGFnLiBJZiBwcmVzZW50IGFuZCBmYWxzZSxcbiAqICAgICB0aGVuIGRvbid0IHJ1biBhIGxpbmUtbGV2ZWwgZGlmZiBmaXJzdCB0byBpZGVudGlmeSB0aGUgY2hhbmdlZCBhcmVhcy5cbiAqICAgICBEZWZhdWx0cyB0byB0cnVlLCB3aGljaCBkb2VzIGEgZmFzdGVyLCBzbGlnaHRseSBsZXNzIG9wdGltYWwgZGlmZi5cbiAqIEBwYXJhbSB7bnVtYmVyfSBvcHRfZGVhZGxpbmUgT3B0aW9uYWwgdGltZSB3aGVuIHRoZSBkaWZmIHNob3VsZCBiZSBjb21wbGV0ZVxuICogICAgIGJ5LiAgVXNlZCBpbnRlcm5hbGx5IGZvciByZWN1cnNpdmUgY2FsbHMuICBVc2VycyBzaG91bGQgc2V0IERpZmZUaW1lb3V0XG4gKiAgICAgaW5zdGVhZC5cbiAqIEByZXR1cm4geyFBcnJheS48IWRpZmZfbWF0Y2hfcGF0Y2guRGlmZj59IEFycmF5IG9mIGRpZmYgdHVwbGVzLlxuICovXG5kaWZmX21hdGNoX3BhdGNoLnByb3RvdHlwZS5kaWZmX21haW4gPSBmdW5jdGlvbih0ZXh0MSwgdGV4dDIsIG9wdF9jaGVja2xpbmVzLFxuICAgIG9wdF9kZWFkbGluZSkge1xuICAvLyBTZXQgYSBkZWFkbGluZSBieSB3aGljaCB0aW1lIHRoZSBkaWZmIG11c3QgYmUgY29tcGxldGUuXG4gIGlmICh0eXBlb2Ygb3B0X2RlYWRsaW5lID09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKHRoaXMuRGlmZl9UaW1lb3V0IDw9IDApIHtcbiAgICAgIG9wdF9kZWFkbGluZSA9IE51bWJlci5NQVhfVkFMVUU7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9wdF9kZWFkbGluZSA9IChuZXcgRGF0ZSkuZ2V0VGltZSgpICsgdGhpcy5EaWZmX1RpbWVvdXQgKiAxMDAwO1xuICAgIH1cbiAgfVxuICB2YXIgZGVhZGxpbmUgPSBvcHRfZGVhZGxpbmU7XG5cbiAgLy8gQ2hlY2sgZm9yIG51bGwgaW5wdXRzLlxuICBpZiAodGV4dDEgPT0gbnVsbCB8fCB0ZXh0MiA9PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdOdWxsIGlucHV0LiAoZGlmZl9tYWluKScpO1xuICB9XG5cbiAgLy8gQ2hlY2sgZm9yIGVxdWFsaXR5IChzcGVlZHVwKS5cbiAgaWYgKHRleHQxID09IHRleHQyKSB7XG4gICAgaWYgKHRleHQxKSB7XG4gICAgICByZXR1cm4gW1tESUZGX0VRVUFMLCB0ZXh0MV1dO1xuICAgIH1cbiAgICByZXR1cm4gW107XG4gIH1cblxuICBpZiAodHlwZW9mIG9wdF9jaGVja2xpbmVzID09ICd1bmRlZmluZWQnKSB7XG4gICAgb3B0X2NoZWNrbGluZXMgPSB0cnVlO1xuICB9XG4gIHZhciBjaGVja2xpbmVzID0gb3B0X2NoZWNrbGluZXM7XG5cbiAgLy8gVHJpbSBvZmYgY29tbW9uIHByZWZpeCAoc3BlZWR1cCkuXG4gIHZhciBjb21tb25sZW5ndGggPSB0aGlzLmRpZmZfY29tbW9uUHJlZml4KHRleHQxLCB0ZXh0Mik7XG4gIHZhciBjb21tb25wcmVmaXggPSB0ZXh0MS5zdWJzdHJpbmcoMCwgY29tbW9ubGVuZ3RoKTtcbiAgdGV4dDEgPSB0ZXh0MS5zdWJzdHJpbmcoY29tbW9ubGVuZ3RoKTtcbiAgdGV4dDIgPSB0ZXh0Mi5zdWJzdHJpbmcoY29tbW9ubGVuZ3RoKTtcblxuICAvLyBUcmltIG9mZiBjb21tb24gc3VmZml4IChzcGVlZHVwKS5cbiAgY29tbW9ubGVuZ3RoID0gdGhpcy5kaWZmX2NvbW1vblN1ZmZpeCh0ZXh0MSwgdGV4dDIpO1xuICB2YXIgY29tbW9uc3VmZml4ID0gdGV4dDEuc3Vic3RyaW5nKHRleHQxLmxlbmd0aCAtIGNvbW1vbmxlbmd0aCk7XG4gIHRleHQxID0gdGV4dDEuc3Vic3RyaW5nKDAsIHRleHQxLmxlbmd0aCAtIGNvbW1vbmxlbmd0aCk7XG4gIHRleHQyID0gdGV4dDIuc3Vic3RyaW5nKDAsIHRleHQyLmxlbmd0aCAtIGNvbW1vbmxlbmd0aCk7XG5cbiAgLy8gQ29tcHV0ZSB0aGUgZGlmZiBvbiB0aGUgbWlkZGxlIGJsb2NrLlxuICB2YXIgZGlmZnMgPSB0aGlzLmRpZmZfY29tcHV0ZV8odGV4dDEsIHRleHQyLCBjaGVja2xpbmVzLCBkZWFkbGluZSk7XG5cbiAgLy8gUmVzdG9yZSB0aGUgcHJlZml4IGFuZCBzdWZmaXguXG4gIGlmIChjb21tb25wcmVmaXgpIHtcbiAgICBkaWZmcy51bnNoaWZ0KFtESUZGX0VRVUFMLCBjb21tb25wcmVmaXhdKTtcbiAgfVxuICBpZiAoY29tbW9uc3VmZml4KSB7XG4gICAgZGlmZnMucHVzaChbRElGRl9FUVVBTCwgY29tbW9uc3VmZml4XSk7XG4gIH1cbiAgdGhpcy5kaWZmX2NsZWFudXBNZXJnZShkaWZmcyk7XG4gIHJldHVybiBkaWZmcztcbn07XG5cblxuLyoqXG4gKiBGaW5kIHRoZSBkaWZmZXJlbmNlcyBiZXR3ZWVuIHR3byB0ZXh0cy4gIEFzc3VtZXMgdGhhdCB0aGUgdGV4dHMgZG8gbm90XG4gKiBoYXZlIGFueSBjb21tb24gcHJlZml4IG9yIHN1ZmZpeC5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0MSBPbGQgc3RyaW5nIHRvIGJlIGRpZmZlZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0MiBOZXcgc3RyaW5nIHRvIGJlIGRpZmZlZC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gY2hlY2tsaW5lcyBTcGVlZHVwIGZsYWcuICBJZiBmYWxzZSwgdGhlbiBkb24ndCBydW4gYVxuICogICAgIGxpbmUtbGV2ZWwgZGlmZiBmaXJzdCB0byBpZGVudGlmeSB0aGUgY2hhbmdlZCBhcmVhcy5cbiAqICAgICBJZiB0cnVlLCB0aGVuIHJ1biBhIGZhc3Rlciwgc2xpZ2h0bHkgbGVzcyBvcHRpbWFsIGRpZmYuXG4gKiBAcGFyYW0ge251bWJlcn0gZGVhZGxpbmUgVGltZSB3aGVuIHRoZSBkaWZmIHNob3VsZCBiZSBjb21wbGV0ZSBieS5cbiAqIEByZXR1cm4geyFBcnJheS48IWRpZmZfbWF0Y2hfcGF0Y2guRGlmZj59IEFycmF5IG9mIGRpZmYgdHVwbGVzLlxuICogQHByaXZhdGVcbiAqL1xuZGlmZl9tYXRjaF9wYXRjaC5wcm90b3R5cGUuZGlmZl9jb21wdXRlXyA9IGZ1bmN0aW9uKHRleHQxLCB0ZXh0MiwgY2hlY2tsaW5lcyxcbiAgICBkZWFkbGluZSkge1xuICB2YXIgZGlmZnM7XG5cbiAgaWYgKCF0ZXh0MSkge1xuICAgIC8vIEp1c3QgYWRkIHNvbWUgdGV4dCAoc3BlZWR1cCkuXG4gICAgcmV0dXJuIFtbRElGRl9JTlNFUlQsIHRleHQyXV07XG4gIH1cblxuICBpZiAoIXRleHQyKSB7XG4gICAgLy8gSnVzdCBkZWxldGUgc29tZSB0ZXh0IChzcGVlZHVwKS5cbiAgICByZXR1cm4gW1tESUZGX0RFTEVURSwgdGV4dDFdXTtcbiAgfVxuXG4gIHZhciBsb25ndGV4dCA9IHRleHQxLmxlbmd0aCA+IHRleHQyLmxlbmd0aCA/IHRleHQxIDogdGV4dDI7XG4gIHZhciBzaG9ydHRleHQgPSB0ZXh0MS5sZW5ndGggPiB0ZXh0Mi5sZW5ndGggPyB0ZXh0MiA6IHRleHQxO1xuICB2YXIgaSA9IGxvbmd0ZXh0LmluZGV4T2Yoc2hvcnR0ZXh0KTtcbiAgaWYgKGkgIT0gLTEpIHtcbiAgICAvLyBTaG9ydGVyIHRleHQgaXMgaW5zaWRlIHRoZSBsb25nZXIgdGV4dCAoc3BlZWR1cCkuXG4gICAgZGlmZnMgPSBbW0RJRkZfSU5TRVJULCBsb25ndGV4dC5zdWJzdHJpbmcoMCwgaSldLFxuICAgICAgICAgICAgIFtESUZGX0VRVUFMLCBzaG9ydHRleHRdLFxuICAgICAgICAgICAgIFtESUZGX0lOU0VSVCwgbG9uZ3RleHQuc3Vic3RyaW5nKGkgKyBzaG9ydHRleHQubGVuZ3RoKV1dO1xuICAgIC8vIFN3YXAgaW5zZXJ0aW9ucyBmb3IgZGVsZXRpb25zIGlmIGRpZmYgaXMgcmV2ZXJzZWQuXG4gICAgaWYgKHRleHQxLmxlbmd0aCA+IHRleHQyLmxlbmd0aCkge1xuICAgICAgZGlmZnNbMF1bMF0gPSBkaWZmc1syXVswXSA9IERJRkZfREVMRVRFO1xuICAgIH1cbiAgICByZXR1cm4gZGlmZnM7XG4gIH1cblxuICBpZiAoc2hvcnR0ZXh0Lmxlbmd0aCA9PSAxKSB7XG4gICAgLy8gU2luZ2xlIGNoYXJhY3RlciBzdHJpbmcuXG4gICAgLy8gQWZ0ZXIgdGhlIHByZXZpb3VzIHNwZWVkdXAsIHRoZSBjaGFyYWN0ZXIgY2FuJ3QgYmUgYW4gZXF1YWxpdHkuXG4gICAgcmV0dXJuIFtbRElGRl9ERUxFVEUsIHRleHQxXSwgW0RJRkZfSU5TRVJULCB0ZXh0Ml1dO1xuICB9XG4gIGxvbmd0ZXh0ID0gc2hvcnR0ZXh0ID0gbnVsbDsgIC8vIEdhcmJhZ2UgY29sbGVjdC5cblxuICAvLyBDaGVjayB0byBzZWUgaWYgdGhlIHByb2JsZW0gY2FuIGJlIHNwbGl0IGluIHR3by5cbiAgdmFyIGhtID0gdGhpcy5kaWZmX2hhbGZNYXRjaF8odGV4dDEsIHRleHQyKTtcbiAgaWYgKGhtKSB7XG4gICAgLy8gQSBoYWxmLW1hdGNoIHdhcyBmb3VuZCwgc29ydCBvdXQgdGhlIHJldHVybiBkYXRhLlxuICAgIHZhciB0ZXh0MV9hID0gaG1bMF07XG4gICAgdmFyIHRleHQxX2IgPSBobVsxXTtcbiAgICB2YXIgdGV4dDJfYSA9IGhtWzJdO1xuICAgIHZhciB0ZXh0Ml9iID0gaG1bM107XG4gICAgdmFyIG1pZF9jb21tb24gPSBobVs0XTtcbiAgICAvLyBTZW5kIGJvdGggcGFpcnMgb2ZmIGZvciBzZXBhcmF0ZSBwcm9jZXNzaW5nLlxuICAgIHZhciBkaWZmc19hID0gdGhpcy5kaWZmX21haW4odGV4dDFfYSwgdGV4dDJfYSwgY2hlY2tsaW5lcywgZGVhZGxpbmUpO1xuICAgIHZhciBkaWZmc19iID0gdGhpcy5kaWZmX21haW4odGV4dDFfYiwgdGV4dDJfYiwgY2hlY2tsaW5lcywgZGVhZGxpbmUpO1xuICAgIC8vIE1lcmdlIHRoZSByZXN1bHRzLlxuICAgIHJldHVybiBkaWZmc19hLmNvbmNhdChbW0RJRkZfRVFVQUwsIG1pZF9jb21tb25dXSwgZGlmZnNfYik7XG4gIH1cblxuICBpZiAoY2hlY2tsaW5lcyAmJiB0ZXh0MS5sZW5ndGggPiAxMDAgJiYgdGV4dDIubGVuZ3RoID4gMTAwKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlmZl9saW5lTW9kZV8odGV4dDEsIHRleHQyLCBkZWFkbGluZSk7XG4gIH1cblxuICByZXR1cm4gdGhpcy5kaWZmX2Jpc2VjdF8odGV4dDEsIHRleHQyLCBkZWFkbGluZSk7XG59O1xuXG5cbi8qKlxuICogRG8gYSBxdWljayBsaW5lLWxldmVsIGRpZmYgb24gYm90aCBzdHJpbmdzLCB0aGVuIHJlZGlmZiB0aGUgcGFydHMgZm9yXG4gKiBncmVhdGVyIGFjY3VyYWN5LlxuICogVGhpcyBzcGVlZHVwIGNhbiBwcm9kdWNlIG5vbi1taW5pbWFsIGRpZmZzLlxuICogQHBhcmFtIHtzdHJpbmd9IHRleHQxIE9sZCBzdHJpbmcgdG8gYmUgZGlmZmVkLlxuICogQHBhcmFtIHtzdHJpbmd9IHRleHQyIE5ldyBzdHJpbmcgdG8gYmUgZGlmZmVkLlxuICogQHBhcmFtIHtudW1iZXJ9IGRlYWRsaW5lIFRpbWUgd2hlbiB0aGUgZGlmZiBzaG91bGQgYmUgY29tcGxldGUgYnkuXG4gKiBAcmV0dXJuIHshQXJyYXkuPCFkaWZmX21hdGNoX3BhdGNoLkRpZmY+fSBBcnJheSBvZiBkaWZmIHR1cGxlcy5cbiAqIEBwcml2YXRlXG4gKi9cbmRpZmZfbWF0Y2hfcGF0Y2gucHJvdG90eXBlLmRpZmZfbGluZU1vZGVfID0gZnVuY3Rpb24odGV4dDEsIHRleHQyLCBkZWFkbGluZSkge1xuICAvLyBTY2FuIHRoZSB0ZXh0IG9uIGEgbGluZS1ieS1saW5lIGJhc2lzIGZpcnN0LlxuICB2YXIgYSA9IHRoaXMuZGlmZl9saW5lc1RvQ2hhcnNfKHRleHQxLCB0ZXh0Mik7XG4gIHRleHQxID0gLyoqIEB0eXBlIHtzdHJpbmd9ICovKGFbMF0pO1xuICB0ZXh0MiA9IC8qKiBAdHlwZSB7c3RyaW5nfSAqLyhhWzFdKTtcbiAgdmFyIGxpbmVhcnJheSA9IC8qKiBAdHlwZSB7IUFycmF5LjxzdHJpbmc+fSAqLyhhWzJdKTtcblxuICB2YXIgZGlmZnMgPSB0aGlzLmRpZmZfYmlzZWN0Xyh0ZXh0MSwgdGV4dDIsIGRlYWRsaW5lKTtcblxuICAvLyBDb252ZXJ0IHRoZSBkaWZmIGJhY2sgdG8gb3JpZ2luYWwgdGV4dC5cbiAgdGhpcy5kaWZmX2NoYXJzVG9MaW5lc18oZGlmZnMsIGxpbmVhcnJheSk7XG4gIC8vIEVsaW1pbmF0ZSBmcmVhayBtYXRjaGVzIChlLmcuIGJsYW5rIGxpbmVzKVxuICB0aGlzLmRpZmZfY2xlYW51cFNlbWFudGljKGRpZmZzKTtcblxuICAvLyBSZWRpZmYgYW55IHJlcGxhY2VtZW50IGJsb2NrcywgdGhpcyB0aW1lIGNoYXJhY3Rlci1ieS1jaGFyYWN0ZXIuXG4gIC8vIEFkZCBhIGR1bW15IGVudHJ5IGF0IHRoZSBlbmQuXG4gIGRpZmZzLnB1c2goW0RJRkZfRVFVQUwsICcnXSk7XG4gIHZhciBwb2ludGVyID0gMDtcbiAgdmFyIGNvdW50X2RlbGV0ZSA9IDA7XG4gIHZhciBjb3VudF9pbnNlcnQgPSAwO1xuICB2YXIgdGV4dF9kZWxldGUgPSAnJztcbiAgdmFyIHRleHRfaW5zZXJ0ID0gJyc7XG4gIHdoaWxlIChwb2ludGVyIDwgZGlmZnMubGVuZ3RoKSB7XG4gICAgc3dpdGNoIChkaWZmc1twb2ludGVyXVswXSkge1xuICAgICAgY2FzZSBESUZGX0lOU0VSVDpcbiAgICAgICAgY291bnRfaW5zZXJ0Kys7XG4gICAgICAgIHRleHRfaW5zZXJ0ICs9IGRpZmZzW3BvaW50ZXJdWzFdO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgRElGRl9ERUxFVEU6XG4gICAgICAgIGNvdW50X2RlbGV0ZSsrO1xuICAgICAgICB0ZXh0X2RlbGV0ZSArPSBkaWZmc1twb2ludGVyXVsxXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIERJRkZfRVFVQUw6XG4gICAgICAgIC8vIFVwb24gcmVhY2hpbmcgYW4gZXF1YWxpdHksIGNoZWNrIGZvciBwcmlvciByZWR1bmRhbmNpZXMuXG4gICAgICAgIGlmIChjb3VudF9kZWxldGUgPj0gMSAmJiBjb3VudF9pbnNlcnQgPj0gMSkge1xuICAgICAgICAgIC8vIERlbGV0ZSB0aGUgb2ZmZW5kaW5nIHJlY29yZHMgYW5kIGFkZCB0aGUgbWVyZ2VkIG9uZXMuXG4gICAgICAgICAgdmFyIGEgPSB0aGlzLmRpZmZfbWFpbih0ZXh0X2RlbGV0ZSwgdGV4dF9pbnNlcnQsIGZhbHNlLCBkZWFkbGluZSk7XG4gICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIgLSBjb3VudF9kZWxldGUgLSBjb3VudF9pbnNlcnQsXG4gICAgICAgICAgICAgICAgICAgICAgIGNvdW50X2RlbGV0ZSArIGNvdW50X2luc2VydCk7XG4gICAgICAgICAgcG9pbnRlciA9IHBvaW50ZXIgLSBjb3VudF9kZWxldGUgLSBjb3VudF9pbnNlcnQ7XG4gICAgICAgICAgZm9yICh2YXIgaiA9IGEubGVuZ3RoIC0gMTsgaiA+PSAwOyBqLS0pIHtcbiAgICAgICAgICAgIGRpZmZzLnNwbGljZShwb2ludGVyLCAwLCBhW2pdKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcG9pbnRlciA9IHBvaW50ZXIgKyBhLmxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICBjb3VudF9pbnNlcnQgPSAwO1xuICAgICAgICBjb3VudF9kZWxldGUgPSAwO1xuICAgICAgICB0ZXh0X2RlbGV0ZSA9ICcnO1xuICAgICAgICB0ZXh0X2luc2VydCA9ICcnO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcG9pbnRlcisrO1xuICB9XG4gIGRpZmZzLnBvcCgpOyAgLy8gUmVtb3ZlIHRoZSBkdW1teSBlbnRyeSBhdCB0aGUgZW5kLlxuXG4gIHJldHVybiBkaWZmcztcbn07XG5cblxuLyoqXG4gKiBGaW5kIHRoZSAnbWlkZGxlIHNuYWtlJyBvZiBhIGRpZmYsIHNwbGl0IHRoZSBwcm9ibGVtIGluIHR3b1xuICogYW5kIHJldHVybiB0aGUgcmVjdXJzaXZlbHkgY29uc3RydWN0ZWQgZGlmZi5cbiAqIFNlZSBNeWVycyAxOTg2IHBhcGVyOiBBbiBPKE5EKSBEaWZmZXJlbmNlIEFsZ29yaXRobSBhbmQgSXRzIFZhcmlhdGlvbnMuXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dDEgT2xkIHN0cmluZyB0byBiZSBkaWZmZWQuXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dDIgTmV3IHN0cmluZyB0byBiZSBkaWZmZWQuXG4gKiBAcGFyYW0ge251bWJlcn0gZGVhZGxpbmUgVGltZSBhdCB3aGljaCB0byBiYWlsIGlmIG5vdCB5ZXQgY29tcGxldGUuXG4gKiBAcmV0dXJuIHshQXJyYXkuPCFkaWZmX21hdGNoX3BhdGNoLkRpZmY+fSBBcnJheSBvZiBkaWZmIHR1cGxlcy5cbiAqIEBwcml2YXRlXG4gKi9cbmRpZmZfbWF0Y2hfcGF0Y2gucHJvdG90eXBlLmRpZmZfYmlzZWN0XyA9IGZ1bmN0aW9uKHRleHQxLCB0ZXh0MiwgZGVhZGxpbmUpIHtcbiAgLy8gQ2FjaGUgdGhlIHRleHQgbGVuZ3RocyB0byBwcmV2ZW50IG11bHRpcGxlIGNhbGxzLlxuICB2YXIgdGV4dDFfbGVuZ3RoID0gdGV4dDEubGVuZ3RoO1xuICB2YXIgdGV4dDJfbGVuZ3RoID0gdGV4dDIubGVuZ3RoO1xuICB2YXIgbWF4X2QgPSBNYXRoLmNlaWwoKHRleHQxX2xlbmd0aCArIHRleHQyX2xlbmd0aCkgLyAyKTtcbiAgdmFyIHZfb2Zmc2V0ID0gbWF4X2Q7XG4gIHZhciB2X2xlbmd0aCA9IDIgKiBtYXhfZDtcbiAgdmFyIHYxID0gbmV3IEFycmF5KHZfbGVuZ3RoKTtcbiAgdmFyIHYyID0gbmV3IEFycmF5KHZfbGVuZ3RoKTtcbiAgLy8gU2V0dGluZyBhbGwgZWxlbWVudHMgdG8gLTEgaXMgZmFzdGVyIGluIENocm9tZSAmIEZpcmVmb3ggdGhhbiBtaXhpbmdcbiAgLy8gaW50ZWdlcnMgYW5kIHVuZGVmaW5lZC5cbiAgZm9yICh2YXIgeCA9IDA7IHggPCB2X2xlbmd0aDsgeCsrKSB7XG4gICAgdjFbeF0gPSAtMTtcbiAgICB2Mlt4XSA9IC0xO1xuICB9XG4gIHYxW3Zfb2Zmc2V0ICsgMV0gPSAwO1xuICB2Mlt2X29mZnNldCArIDFdID0gMDtcbiAgdmFyIGRlbHRhID0gdGV4dDFfbGVuZ3RoIC0gdGV4dDJfbGVuZ3RoO1xuICAvLyBJZiB0aGUgdG90YWwgbnVtYmVyIG9mIGNoYXJhY3RlcnMgaXMgb2RkLCB0aGVuIHRoZSBmcm9udCBwYXRoIHdpbGwgY29sbGlkZVxuICAvLyB3aXRoIHRoZSByZXZlcnNlIHBhdGguXG4gIHZhciBmcm9udCA9IChkZWx0YSAlIDIgIT0gMCk7XG4gIC8vIE9mZnNldHMgZm9yIHN0YXJ0IGFuZCBlbmQgb2YgayBsb29wLlxuICAvLyBQcmV2ZW50cyBtYXBwaW5nIG9mIHNwYWNlIGJleW9uZCB0aGUgZ3JpZC5cbiAgdmFyIGsxc3RhcnQgPSAwO1xuICB2YXIgazFlbmQgPSAwO1xuICB2YXIgazJzdGFydCA9IDA7XG4gIHZhciBrMmVuZCA9IDA7XG4gIGZvciAodmFyIGQgPSAwOyBkIDwgbWF4X2Q7IGQrKykge1xuICAgIC8vIEJhaWwgb3V0IGlmIGRlYWRsaW5lIGlzIHJlYWNoZWQuXG4gICAgaWYgKChuZXcgRGF0ZSgpKS5nZXRUaW1lKCkgPiBkZWFkbGluZSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgLy8gV2FsayB0aGUgZnJvbnQgcGF0aCBvbmUgc3RlcC5cbiAgICBmb3IgKHZhciBrMSA9IC1kICsgazFzdGFydDsgazEgPD0gZCAtIGsxZW5kOyBrMSArPSAyKSB7XG4gICAgICB2YXIgazFfb2Zmc2V0ID0gdl9vZmZzZXQgKyBrMTtcbiAgICAgIHZhciB4MTtcbiAgICAgIGlmIChrMSA9PSAtZCB8fCBrMSAhPSBkICYmIHYxW2sxX29mZnNldCAtIDFdIDwgdjFbazFfb2Zmc2V0ICsgMV0pIHtcbiAgICAgICAgeDEgPSB2MVtrMV9vZmZzZXQgKyAxXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHgxID0gdjFbazFfb2Zmc2V0IC0gMV0gKyAxO1xuICAgICAgfVxuICAgICAgdmFyIHkxID0geDEgLSBrMTtcbiAgICAgIHdoaWxlICh4MSA8IHRleHQxX2xlbmd0aCAmJiB5MSA8IHRleHQyX2xlbmd0aCAmJlxuICAgICAgICAgICAgIHRleHQxLmNoYXJBdCh4MSkgPT0gdGV4dDIuY2hhckF0KHkxKSkge1xuICAgICAgICB4MSsrO1xuICAgICAgICB5MSsrO1xuICAgICAgfVxuICAgICAgdjFbazFfb2Zmc2V0XSA9IHgxO1xuICAgICAgaWYgKHgxID4gdGV4dDFfbGVuZ3RoKSB7XG4gICAgICAgIC8vIFJhbiBvZmYgdGhlIHJpZ2h0IG9mIHRoZSBncmFwaC5cbiAgICAgICAgazFlbmQgKz0gMjtcbiAgICAgIH0gZWxzZSBpZiAoeTEgPiB0ZXh0Ml9sZW5ndGgpIHtcbiAgICAgICAgLy8gUmFuIG9mZiB0aGUgYm90dG9tIG9mIHRoZSBncmFwaC5cbiAgICAgICAgazFzdGFydCArPSAyO1xuICAgICAgfSBlbHNlIGlmIChmcm9udCkge1xuICAgICAgICB2YXIgazJfb2Zmc2V0ID0gdl9vZmZzZXQgKyBkZWx0YSAtIGsxO1xuICAgICAgICBpZiAoazJfb2Zmc2V0ID49IDAgJiYgazJfb2Zmc2V0IDwgdl9sZW5ndGggJiYgdjJbazJfb2Zmc2V0XSAhPSAtMSkge1xuICAgICAgICAgIC8vIE1pcnJvciB4MiBvbnRvIHRvcC1sZWZ0IGNvb3JkaW5hdGUgc3lzdGVtLlxuICAgICAgICAgIHZhciB4MiA9IHRleHQxX2xlbmd0aCAtIHYyW2syX29mZnNldF07XG4gICAgICAgICAgaWYgKHgxID49IHgyKSB7XG4gICAgICAgICAgICAvLyBPdmVybGFwIGRldGVjdGVkLlxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGlmZl9iaXNlY3RTcGxpdF8odGV4dDEsIHRleHQyLCB4MSwgeTEsIGRlYWRsaW5lKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBXYWxrIHRoZSByZXZlcnNlIHBhdGggb25lIHN0ZXAuXG4gICAgZm9yICh2YXIgazIgPSAtZCArIGsyc3RhcnQ7IGsyIDw9IGQgLSBrMmVuZDsgazIgKz0gMikge1xuICAgICAgdmFyIGsyX29mZnNldCA9IHZfb2Zmc2V0ICsgazI7XG4gICAgICB2YXIgeDI7XG4gICAgICBpZiAoazIgPT0gLWQgfHwgazIgIT0gZCAmJiB2MltrMl9vZmZzZXQgLSAxXSA8IHYyW2syX29mZnNldCArIDFdKSB7XG4gICAgICAgIHgyID0gdjJbazJfb2Zmc2V0ICsgMV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB4MiA9IHYyW2syX29mZnNldCAtIDFdICsgMTtcbiAgICAgIH1cbiAgICAgIHZhciB5MiA9IHgyIC0gazI7XG4gICAgICB3aGlsZSAoeDIgPCB0ZXh0MV9sZW5ndGggJiYgeTIgPCB0ZXh0Ml9sZW5ndGggJiZcbiAgICAgICAgICAgICB0ZXh0MS5jaGFyQXQodGV4dDFfbGVuZ3RoIC0geDIgLSAxKSA9PVxuICAgICAgICAgICAgIHRleHQyLmNoYXJBdCh0ZXh0Ml9sZW5ndGggLSB5MiAtIDEpKSB7XG4gICAgICAgIHgyKys7XG4gICAgICAgIHkyKys7XG4gICAgICB9XG4gICAgICB2MltrMl9vZmZzZXRdID0geDI7XG4gICAgICBpZiAoeDIgPiB0ZXh0MV9sZW5ndGgpIHtcbiAgICAgICAgLy8gUmFuIG9mZiB0aGUgbGVmdCBvZiB0aGUgZ3JhcGguXG4gICAgICAgIGsyZW5kICs9IDI7XG4gICAgICB9IGVsc2UgaWYgKHkyID4gdGV4dDJfbGVuZ3RoKSB7XG4gICAgICAgIC8vIFJhbiBvZmYgdGhlIHRvcCBvZiB0aGUgZ3JhcGguXG4gICAgICAgIGsyc3RhcnQgKz0gMjtcbiAgICAgIH0gZWxzZSBpZiAoIWZyb250KSB7XG4gICAgICAgIHZhciBrMV9vZmZzZXQgPSB2X29mZnNldCArIGRlbHRhIC0gazI7XG4gICAgICAgIGlmIChrMV9vZmZzZXQgPj0gMCAmJiBrMV9vZmZzZXQgPCB2X2xlbmd0aCAmJiB2MVtrMV9vZmZzZXRdICE9IC0xKSB7XG4gICAgICAgICAgdmFyIHgxID0gdjFbazFfb2Zmc2V0XTtcbiAgICAgICAgICB2YXIgeTEgPSB2X29mZnNldCArIHgxIC0gazFfb2Zmc2V0O1xuICAgICAgICAgIC8vIE1pcnJvciB4MiBvbnRvIHRvcC1sZWZ0IGNvb3JkaW5hdGUgc3lzdGVtLlxuICAgICAgICAgIHgyID0gdGV4dDFfbGVuZ3RoIC0geDI7XG4gICAgICAgICAgaWYgKHgxID49IHgyKSB7XG4gICAgICAgICAgICAvLyBPdmVybGFwIGRldGVjdGVkLlxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGlmZl9iaXNlY3RTcGxpdF8odGV4dDEsIHRleHQyLCB4MSwgeTEsIGRlYWRsaW5lKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLy8gRGlmZiB0b29rIHRvbyBsb25nIGFuZCBoaXQgdGhlIGRlYWRsaW5lIG9yXG4gIC8vIG51bWJlciBvZiBkaWZmcyBlcXVhbHMgbnVtYmVyIG9mIGNoYXJhY3RlcnMsIG5vIGNvbW1vbmFsaXR5IGF0IGFsbC5cbiAgcmV0dXJuIFtbRElGRl9ERUxFVEUsIHRleHQxXSwgW0RJRkZfSU5TRVJULCB0ZXh0Ml1dO1xufTtcblxuXG4vKipcbiAqIEdpdmVuIHRoZSBsb2NhdGlvbiBvZiB0aGUgJ21pZGRsZSBzbmFrZScsIHNwbGl0IHRoZSBkaWZmIGluIHR3byBwYXJ0c1xuICogYW5kIHJlY3Vyc2UuXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dDEgT2xkIHN0cmluZyB0byBiZSBkaWZmZWQuXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dDIgTmV3IHN0cmluZyB0byBiZSBkaWZmZWQuXG4gKiBAcGFyYW0ge251bWJlcn0geCBJbmRleCBvZiBzcGxpdCBwb2ludCBpbiB0ZXh0MS5cbiAqIEBwYXJhbSB7bnVtYmVyfSB5IEluZGV4IG9mIHNwbGl0IHBvaW50IGluIHRleHQyLlxuICogQHBhcmFtIHtudW1iZXJ9IGRlYWRsaW5lIFRpbWUgYXQgd2hpY2ggdG8gYmFpbCBpZiBub3QgeWV0IGNvbXBsZXRlLlxuICogQHJldHVybiB7IUFycmF5LjwhZGlmZl9tYXRjaF9wYXRjaC5EaWZmPn0gQXJyYXkgb2YgZGlmZiB0dXBsZXMuXG4gKiBAcHJpdmF0ZVxuICovXG5kaWZmX21hdGNoX3BhdGNoLnByb3RvdHlwZS5kaWZmX2Jpc2VjdFNwbGl0XyA9IGZ1bmN0aW9uKHRleHQxLCB0ZXh0MiwgeCwgeSxcbiAgICBkZWFkbGluZSkge1xuICB2YXIgdGV4dDFhID0gdGV4dDEuc3Vic3RyaW5nKDAsIHgpO1xuICB2YXIgdGV4dDJhID0gdGV4dDIuc3Vic3RyaW5nKDAsIHkpO1xuICB2YXIgdGV4dDFiID0gdGV4dDEuc3Vic3RyaW5nKHgpO1xuICB2YXIgdGV4dDJiID0gdGV4dDIuc3Vic3RyaW5nKHkpO1xuXG4gIC8vIENvbXB1dGUgYm90aCBkaWZmcyBzZXJpYWxseS5cbiAgdmFyIGRpZmZzID0gdGhpcy5kaWZmX21haW4odGV4dDFhLCB0ZXh0MmEsIGZhbHNlLCBkZWFkbGluZSk7XG4gIHZhciBkaWZmc2IgPSB0aGlzLmRpZmZfbWFpbih0ZXh0MWIsIHRleHQyYiwgZmFsc2UsIGRlYWRsaW5lKTtcblxuICByZXR1cm4gZGlmZnMuY29uY2F0KGRpZmZzYik7XG59O1xuXG5cbi8qKlxuICogU3BsaXQgdHdvIHRleHRzIGludG8gYW4gYXJyYXkgb2Ygc3RyaW5ncy4gIFJlZHVjZSB0aGUgdGV4dHMgdG8gYSBzdHJpbmcgb2ZcbiAqIGhhc2hlcyB3aGVyZSBlYWNoIFVuaWNvZGUgY2hhcmFjdGVyIHJlcHJlc2VudHMgb25lIGxpbmUuXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dDEgRmlyc3Qgc3RyaW5nLlxuICogQHBhcmFtIHtzdHJpbmd9IHRleHQyIFNlY29uZCBzdHJpbmcuXG4gKiBAcmV0dXJuIHshQXJyYXkuPHN0cmluZ3whQXJyYXkuPHN0cmluZz4+fSBUaHJlZSBlbGVtZW50IEFycmF5LCBjb250YWluaW5nIHRoZVxuICogICAgIGVuY29kZWQgdGV4dDEsIHRoZSBlbmNvZGVkIHRleHQyIGFuZCB0aGUgYXJyYXkgb2YgdW5pcXVlIHN0cmluZ3MuICBUaGVcbiAqICAgICB6ZXJvdGggZWxlbWVudCBvZiB0aGUgYXJyYXkgb2YgdW5pcXVlIHN0cmluZ3MgaXMgaW50ZW50aW9uYWxseSBibGFuay5cbiAqIEBwcml2YXRlXG4gKi9cbmRpZmZfbWF0Y2hfcGF0Y2gucHJvdG90eXBlLmRpZmZfbGluZXNUb0NoYXJzXyA9IGZ1bmN0aW9uKHRleHQxLCB0ZXh0Mikge1xuICB2YXIgbGluZUFycmF5ID0gW107ICAvLyBlLmcuIGxpbmVBcnJheVs0XSA9PSAnSGVsbG9cXG4nXG4gIHZhciBsaW5lSGFzaCA9IHt9OyAgIC8vIGUuZy4gbGluZUhhc2hbJ0hlbGxvXFxuJ10gPT0gNFxuXG4gIC8vICdcXHgwMCcgaXMgYSB2YWxpZCBjaGFyYWN0ZXIsIGJ1dCB2YXJpb3VzIGRlYnVnZ2VycyBkb24ndCBsaWtlIGl0LlxuICAvLyBTbyB3ZSdsbCBpbnNlcnQgYSBqdW5rIGVudHJ5IHRvIGF2b2lkIGdlbmVyYXRpbmcgYSBudWxsIGNoYXJhY3Rlci5cbiAgbGluZUFycmF5WzBdID0gJyc7XG5cbiAgLyoqXG4gICAqIFNwbGl0IGEgdGV4dCBpbnRvIGFuIGFycmF5IG9mIHN0cmluZ3MuICBSZWR1Y2UgdGhlIHRleHRzIHRvIGEgc3RyaW5nIG9mXG4gICAqIGhhc2hlcyB3aGVyZSBlYWNoIFVuaWNvZGUgY2hhcmFjdGVyIHJlcHJlc2VudHMgb25lIGxpbmUuXG4gICAqIE1vZGlmaWVzIGxpbmVhcnJheSBhbmQgbGluZWhhc2ggdGhyb3VnaCBiZWluZyBhIGNsb3N1cmUuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IFN0cmluZyB0byBlbmNvZGUuXG4gICAqIEByZXR1cm4ge3N0cmluZ30gRW5jb2RlZCBzdHJpbmcuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBmdW5jdGlvbiBkaWZmX2xpbmVzVG9DaGFyc011bmdlXyh0ZXh0KSB7XG4gICAgdmFyIGNoYXJzID0gJyc7XG4gICAgLy8gV2FsayB0aGUgdGV4dCwgcHVsbGluZyBvdXQgYSBzdWJzdHJpbmcgZm9yIGVhY2ggbGluZS5cbiAgICAvLyB0ZXh0LnNwbGl0KCdcXG4nKSB3b3VsZCB3b3VsZCB0ZW1wb3JhcmlseSBkb3VibGUgb3VyIG1lbW9yeSBmb290cHJpbnQuXG4gICAgLy8gTW9kaWZ5aW5nIHRleHQgd291bGQgY3JlYXRlIG1hbnkgbGFyZ2Ugc3RyaW5ncyB0byBnYXJiYWdlIGNvbGxlY3QuXG4gICAgdmFyIGxpbmVTdGFydCA9IDA7XG4gICAgdmFyIGxpbmVFbmQgPSAtMTtcbiAgICAvLyBLZWVwaW5nIG91ciBvd24gbGVuZ3RoIHZhcmlhYmxlIGlzIGZhc3RlciB0aGFuIGxvb2tpbmcgaXQgdXAuXG4gICAgdmFyIGxpbmVBcnJheUxlbmd0aCA9IGxpbmVBcnJheS5sZW5ndGg7XG4gICAgd2hpbGUgKGxpbmVFbmQgPCB0ZXh0Lmxlbmd0aCAtIDEpIHtcbiAgICAgIGxpbmVFbmQgPSB0ZXh0LmluZGV4T2YoJ1xcbicsIGxpbmVTdGFydCk7XG4gICAgICBpZiAobGluZUVuZCA9PSAtMSkge1xuICAgICAgICBsaW5lRW5kID0gdGV4dC5sZW5ndGggLSAxO1xuICAgICAgfVxuICAgICAgdmFyIGxpbmUgPSB0ZXh0LnN1YnN0cmluZyhsaW5lU3RhcnQsIGxpbmVFbmQgKyAxKTtcbiAgICAgIGxpbmVTdGFydCA9IGxpbmVFbmQgKyAxO1xuXG4gICAgICBpZiAobGluZUhhc2guaGFzT3duUHJvcGVydHkgPyBsaW5lSGFzaC5oYXNPd25Qcm9wZXJ0eShsaW5lKSA6XG4gICAgICAgICAgKGxpbmVIYXNoW2xpbmVdICE9PSB1bmRlZmluZWQpKSB7XG4gICAgICAgIGNoYXJzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUobGluZUhhc2hbbGluZV0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2hhcnMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShsaW5lQXJyYXlMZW5ndGgpO1xuICAgICAgICBsaW5lSGFzaFtsaW5lXSA9IGxpbmVBcnJheUxlbmd0aDtcbiAgICAgICAgbGluZUFycmF5W2xpbmVBcnJheUxlbmd0aCsrXSA9IGxpbmU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjaGFycztcbiAgfVxuXG4gIHZhciBjaGFyczEgPSBkaWZmX2xpbmVzVG9DaGFyc011bmdlXyh0ZXh0MSk7XG4gIHZhciBjaGFyczIgPSBkaWZmX2xpbmVzVG9DaGFyc011bmdlXyh0ZXh0Mik7XG4gIHJldHVybiBbY2hhcnMxLCBjaGFyczIsIGxpbmVBcnJheV07XG59O1xuXG5cbi8qKlxuICogUmVoeWRyYXRlIHRoZSB0ZXh0IGluIGEgZGlmZiBmcm9tIGEgc3RyaW5nIG9mIGxpbmUgaGFzaGVzIHRvIHJlYWwgbGluZXMgb2ZcbiAqIHRleHQuXG4gKiBAcGFyYW0geyFBcnJheS48IWRpZmZfbWF0Y2hfcGF0Y2guRGlmZj59IGRpZmZzIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxuICogQHBhcmFtIHshQXJyYXkuPHN0cmluZz59IGxpbmVBcnJheSBBcnJheSBvZiB1bmlxdWUgc3RyaW5ncy5cbiAqIEBwcml2YXRlXG4gKi9cbmRpZmZfbWF0Y2hfcGF0Y2gucHJvdG90eXBlLmRpZmZfY2hhcnNUb0xpbmVzXyA9IGZ1bmN0aW9uKGRpZmZzLCBsaW5lQXJyYXkpIHtcbiAgZm9yICh2YXIgeCA9IDA7IHggPCBkaWZmcy5sZW5ndGg7IHgrKykge1xuICAgIHZhciBjaGFycyA9IGRpZmZzW3hdWzFdO1xuICAgIHZhciB0ZXh0ID0gW107XG4gICAgZm9yICh2YXIgeSA9IDA7IHkgPCBjaGFycy5sZW5ndGg7IHkrKykge1xuICAgICAgdGV4dFt5XSA9IGxpbmVBcnJheVtjaGFycy5jaGFyQ29kZUF0KHkpXTtcbiAgICB9XG4gICAgZGlmZnNbeF1bMV0gPSB0ZXh0LmpvaW4oJycpO1xuICB9XG59O1xuXG5cbi8qKlxuICogRGV0ZXJtaW5lIHRoZSBjb21tb24gcHJlZml4IG9mIHR3byBzdHJpbmdzLlxuICogQHBhcmFtIHtzdHJpbmd9IHRleHQxIEZpcnN0IHN0cmluZy5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0MiBTZWNvbmQgc3RyaW5nLlxuICogQHJldHVybiB7bnVtYmVyfSBUaGUgbnVtYmVyIG9mIGNoYXJhY3RlcnMgY29tbW9uIHRvIHRoZSBzdGFydCBvZiBlYWNoXG4gKiAgICAgc3RyaW5nLlxuICovXG5kaWZmX21hdGNoX3BhdGNoLnByb3RvdHlwZS5kaWZmX2NvbW1vblByZWZpeCA9IGZ1bmN0aW9uKHRleHQxLCB0ZXh0Mikge1xuICAvLyBRdWljayBjaGVjayBmb3IgY29tbW9uIG51bGwgY2FzZXMuXG4gIGlmICghdGV4dDEgfHwgIXRleHQyIHx8IHRleHQxLmNoYXJBdCgwKSAhPSB0ZXh0Mi5jaGFyQXQoMCkpIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuICAvLyBCaW5hcnkgc2VhcmNoLlxuICAvLyBQZXJmb3JtYW5jZSBhbmFseXNpczogaHR0cDovL25laWwuZnJhc2VyLm5hbWUvbmV3cy8yMDA3LzEwLzA5L1xuICB2YXIgcG9pbnRlcm1pbiA9IDA7XG4gIHZhciBwb2ludGVybWF4ID0gTWF0aC5taW4odGV4dDEubGVuZ3RoLCB0ZXh0Mi5sZW5ndGgpO1xuICB2YXIgcG9pbnRlcm1pZCA9IHBvaW50ZXJtYXg7XG4gIHZhciBwb2ludGVyc3RhcnQgPSAwO1xuICB3aGlsZSAocG9pbnRlcm1pbiA8IHBvaW50ZXJtaWQpIHtcbiAgICBpZiAodGV4dDEuc3Vic3RyaW5nKHBvaW50ZXJzdGFydCwgcG9pbnRlcm1pZCkgPT1cbiAgICAgICAgdGV4dDIuc3Vic3RyaW5nKHBvaW50ZXJzdGFydCwgcG9pbnRlcm1pZCkpIHtcbiAgICAgIHBvaW50ZXJtaW4gPSBwb2ludGVybWlkO1xuICAgICAgcG9pbnRlcnN0YXJ0ID0gcG9pbnRlcm1pbjtcbiAgICB9IGVsc2Uge1xuICAgICAgcG9pbnRlcm1heCA9IHBvaW50ZXJtaWQ7XG4gICAgfVxuICAgIHBvaW50ZXJtaWQgPSBNYXRoLmZsb29yKChwb2ludGVybWF4IC0gcG9pbnRlcm1pbikgLyAyICsgcG9pbnRlcm1pbik7XG4gIH1cbiAgcmV0dXJuIHBvaW50ZXJtaWQ7XG59O1xuXG5cbi8qKlxuICogRGV0ZXJtaW5lIHRoZSBjb21tb24gc3VmZml4IG9mIHR3byBzdHJpbmdzLlxuICogQHBhcmFtIHtzdHJpbmd9IHRleHQxIEZpcnN0IHN0cmluZy5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0MiBTZWNvbmQgc3RyaW5nLlxuICogQHJldHVybiB7bnVtYmVyfSBUaGUgbnVtYmVyIG9mIGNoYXJhY3RlcnMgY29tbW9uIHRvIHRoZSBlbmQgb2YgZWFjaCBzdHJpbmcuXG4gKi9cbmRpZmZfbWF0Y2hfcGF0Y2gucHJvdG90eXBlLmRpZmZfY29tbW9uU3VmZml4ID0gZnVuY3Rpb24odGV4dDEsIHRleHQyKSB7XG4gIC8vIFF1aWNrIGNoZWNrIGZvciBjb21tb24gbnVsbCBjYXNlcy5cbiAgaWYgKCF0ZXh0MSB8fCAhdGV4dDIgfHxcbiAgICAgIHRleHQxLmNoYXJBdCh0ZXh0MS5sZW5ndGggLSAxKSAhPSB0ZXh0Mi5jaGFyQXQodGV4dDIubGVuZ3RoIC0gMSkpIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuICAvLyBCaW5hcnkgc2VhcmNoLlxuICAvLyBQZXJmb3JtYW5jZSBhbmFseXNpczogaHR0cDovL25laWwuZnJhc2VyLm5hbWUvbmV3cy8yMDA3LzEwLzA5L1xuICB2YXIgcG9pbnRlcm1pbiA9IDA7XG4gIHZhciBwb2ludGVybWF4ID0gTWF0aC5taW4odGV4dDEubGVuZ3RoLCB0ZXh0Mi5sZW5ndGgpO1xuICB2YXIgcG9pbnRlcm1pZCA9IHBvaW50ZXJtYXg7XG4gIHZhciBwb2ludGVyZW5kID0gMDtcbiAgd2hpbGUgKHBvaW50ZXJtaW4gPCBwb2ludGVybWlkKSB7XG4gICAgaWYgKHRleHQxLnN1YnN0cmluZyh0ZXh0MS5sZW5ndGggLSBwb2ludGVybWlkLCB0ZXh0MS5sZW5ndGggLSBwb2ludGVyZW5kKSA9PVxuICAgICAgICB0ZXh0Mi5zdWJzdHJpbmcodGV4dDIubGVuZ3RoIC0gcG9pbnRlcm1pZCwgdGV4dDIubGVuZ3RoIC0gcG9pbnRlcmVuZCkpIHtcbiAgICAgIHBvaW50ZXJtaW4gPSBwb2ludGVybWlkO1xuICAgICAgcG9pbnRlcmVuZCA9IHBvaW50ZXJtaW47XG4gICAgfSBlbHNlIHtcbiAgICAgIHBvaW50ZXJtYXggPSBwb2ludGVybWlkO1xuICAgIH1cbiAgICBwb2ludGVybWlkID0gTWF0aC5mbG9vcigocG9pbnRlcm1heCAtIHBvaW50ZXJtaW4pIC8gMiArIHBvaW50ZXJtaW4pO1xuICB9XG4gIHJldHVybiBwb2ludGVybWlkO1xufTtcblxuXG4vKipcbiAqIERldGVybWluZSBpZiB0aGUgc3VmZml4IG9mIG9uZSBzdHJpbmcgaXMgdGhlIHByZWZpeCBvZiBhbm90aGVyLlxuICogQHBhcmFtIHtzdHJpbmd9IHRleHQxIEZpcnN0IHN0cmluZy5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0MiBTZWNvbmQgc3RyaW5nLlxuICogQHJldHVybiB7bnVtYmVyfSBUaGUgbnVtYmVyIG9mIGNoYXJhY3RlcnMgY29tbW9uIHRvIHRoZSBlbmQgb2YgdGhlIGZpcnN0XG4gKiAgICAgc3RyaW5nIGFuZCB0aGUgc3RhcnQgb2YgdGhlIHNlY29uZCBzdHJpbmcuXG4gKiBAcHJpdmF0ZVxuICovXG5kaWZmX21hdGNoX3BhdGNoLnByb3RvdHlwZS5kaWZmX2NvbW1vbk92ZXJsYXBfID0gZnVuY3Rpb24odGV4dDEsIHRleHQyKSB7XG4gIC8vIENhY2hlIHRoZSB0ZXh0IGxlbmd0aHMgdG8gcHJldmVudCBtdWx0aXBsZSBjYWxscy5cbiAgdmFyIHRleHQxX2xlbmd0aCA9IHRleHQxLmxlbmd0aDtcbiAgdmFyIHRleHQyX2xlbmd0aCA9IHRleHQyLmxlbmd0aDtcbiAgLy8gRWxpbWluYXRlIHRoZSBudWxsIGNhc2UuXG4gIGlmICh0ZXh0MV9sZW5ndGggPT0gMCB8fCB0ZXh0Ml9sZW5ndGggPT0gMCkge1xuICAgIHJldHVybiAwO1xuICB9XG4gIC8vIFRydW5jYXRlIHRoZSBsb25nZXIgc3RyaW5nLlxuICBpZiAodGV4dDFfbGVuZ3RoID4gdGV4dDJfbGVuZ3RoKSB7XG4gICAgdGV4dDEgPSB0ZXh0MS5zdWJzdHJpbmcodGV4dDFfbGVuZ3RoIC0gdGV4dDJfbGVuZ3RoKTtcbiAgfSBlbHNlIGlmICh0ZXh0MV9sZW5ndGggPCB0ZXh0Ml9sZW5ndGgpIHtcbiAgICB0ZXh0MiA9IHRleHQyLnN1YnN0cmluZygwLCB0ZXh0MV9sZW5ndGgpO1xuICB9XG4gIHZhciB0ZXh0X2xlbmd0aCA9IE1hdGgubWluKHRleHQxX2xlbmd0aCwgdGV4dDJfbGVuZ3RoKTtcbiAgLy8gUXVpY2sgY2hlY2sgZm9yIHRoZSB3b3JzdCBjYXNlLlxuICBpZiAodGV4dDEgPT0gdGV4dDIpIHtcbiAgICByZXR1cm4gdGV4dF9sZW5ndGg7XG4gIH1cblxuICAvLyBTdGFydCBieSBsb29raW5nIGZvciBhIHNpbmdsZSBjaGFyYWN0ZXIgbWF0Y2hcbiAgLy8gYW5kIGluY3JlYXNlIGxlbmd0aCB1bnRpbCBubyBtYXRjaCBpcyBmb3VuZC5cbiAgLy8gUGVyZm9ybWFuY2UgYW5hbHlzaXM6IGh0dHA6Ly9uZWlsLmZyYXNlci5uYW1lL25ld3MvMjAxMC8xMS8wNC9cbiAgdmFyIGJlc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gMTtcbiAgd2hpbGUgKHRydWUpIHtcbiAgICB2YXIgcGF0dGVybiA9IHRleHQxLnN1YnN0cmluZyh0ZXh0X2xlbmd0aCAtIGxlbmd0aCk7XG4gICAgdmFyIGZvdW5kID0gdGV4dDIuaW5kZXhPZihwYXR0ZXJuKTtcbiAgICBpZiAoZm91bmQgPT0gLTEpIHtcbiAgICAgIHJldHVybiBiZXN0O1xuICAgIH1cbiAgICBsZW5ndGggKz0gZm91bmQ7XG4gICAgaWYgKGZvdW5kID09IDAgfHwgdGV4dDEuc3Vic3RyaW5nKHRleHRfbGVuZ3RoIC0gbGVuZ3RoKSA9PVxuICAgICAgICB0ZXh0Mi5zdWJzdHJpbmcoMCwgbGVuZ3RoKSkge1xuICAgICAgYmVzdCA9IGxlbmd0aDtcbiAgICAgIGxlbmd0aCsrO1xuICAgIH1cbiAgfVxufTtcblxuXG4vKipcbiAqIERvIHRoZSB0d28gdGV4dHMgc2hhcmUgYSBzdWJzdHJpbmcgd2hpY2ggaXMgYXQgbGVhc3QgaGFsZiB0aGUgbGVuZ3RoIG9mIHRoZVxuICogbG9uZ2VyIHRleHQ/XG4gKiBUaGlzIHNwZWVkdXAgY2FuIHByb2R1Y2Ugbm9uLW1pbmltYWwgZGlmZnMuXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dDEgRmlyc3Qgc3RyaW5nLlxuICogQHBhcmFtIHtzdHJpbmd9IHRleHQyIFNlY29uZCBzdHJpbmcuXG4gKiBAcmV0dXJuIHtBcnJheS48c3RyaW5nPn0gRml2ZSBlbGVtZW50IEFycmF5LCBjb250YWluaW5nIHRoZSBwcmVmaXggb2ZcbiAqICAgICB0ZXh0MSwgdGhlIHN1ZmZpeCBvZiB0ZXh0MSwgdGhlIHByZWZpeCBvZiB0ZXh0MiwgdGhlIHN1ZmZpeCBvZlxuICogICAgIHRleHQyIGFuZCB0aGUgY29tbW9uIG1pZGRsZS4gIE9yIG51bGwgaWYgdGhlcmUgd2FzIG5vIG1hdGNoLlxuICogQHByaXZhdGVcbiAqL1xuZGlmZl9tYXRjaF9wYXRjaC5wcm90b3R5cGUuZGlmZl9oYWxmTWF0Y2hfID0gZnVuY3Rpb24odGV4dDEsIHRleHQyKSB7XG4gIGlmICh0aGlzLkRpZmZfVGltZW91dCA8PSAwKSB7XG4gICAgLy8gRG9uJ3QgcmlzayByZXR1cm5pbmcgYSBub24tb3B0aW1hbCBkaWZmIGlmIHdlIGhhdmUgdW5saW1pdGVkIHRpbWUuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgdmFyIGxvbmd0ZXh0ID0gdGV4dDEubGVuZ3RoID4gdGV4dDIubGVuZ3RoID8gdGV4dDEgOiB0ZXh0MjtcbiAgdmFyIHNob3J0dGV4dCA9IHRleHQxLmxlbmd0aCA+IHRleHQyLmxlbmd0aCA/IHRleHQyIDogdGV4dDE7XG4gIGlmIChsb25ndGV4dC5sZW5ndGggPCA0IHx8IHNob3J0dGV4dC5sZW5ndGggKiAyIDwgbG9uZ3RleHQubGVuZ3RoKSB7XG4gICAgcmV0dXJuIG51bGw7ICAvLyBQb2ludGxlc3MuXG4gIH1cbiAgdmFyIGRtcCA9IHRoaXM7ICAvLyAndGhpcycgYmVjb21lcyAnd2luZG93JyBpbiBhIGNsb3N1cmUuXG5cbiAgLyoqXG4gICAqIERvZXMgYSBzdWJzdHJpbmcgb2Ygc2hvcnR0ZXh0IGV4aXN0IHdpdGhpbiBsb25ndGV4dCBzdWNoIHRoYXQgdGhlIHN1YnN0cmluZ1xuICAgKiBpcyBhdCBsZWFzdCBoYWxmIHRoZSBsZW5ndGggb2YgbG9uZ3RleHQ/XG4gICAqIENsb3N1cmUsIGJ1dCBkb2VzIG5vdCByZWZlcmVuY2UgYW55IGV4dGVybmFsIHZhcmlhYmxlcy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGxvbmd0ZXh0IExvbmdlciBzdHJpbmcuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzaG9ydHRleHQgU2hvcnRlciBzdHJpbmcuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBpIFN0YXJ0IGluZGV4IG9mIHF1YXJ0ZXIgbGVuZ3RoIHN1YnN0cmluZyB3aXRoaW4gbG9uZ3RleHQuXG4gICAqIEByZXR1cm4ge0FycmF5LjxzdHJpbmc+fSBGaXZlIGVsZW1lbnQgQXJyYXksIGNvbnRhaW5pbmcgdGhlIHByZWZpeCBvZlxuICAgKiAgICAgbG9uZ3RleHQsIHRoZSBzdWZmaXggb2YgbG9uZ3RleHQsIHRoZSBwcmVmaXggb2Ygc2hvcnR0ZXh0LCB0aGUgc3VmZml4XG4gICAqICAgICBvZiBzaG9ydHRleHQgYW5kIHRoZSBjb21tb24gbWlkZGxlLiAgT3IgbnVsbCBpZiB0aGVyZSB3YXMgbm8gbWF0Y2guXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBmdW5jdGlvbiBkaWZmX2hhbGZNYXRjaElfKGxvbmd0ZXh0LCBzaG9ydHRleHQsIGkpIHtcbiAgICAvLyBTdGFydCB3aXRoIGEgMS80IGxlbmd0aCBzdWJzdHJpbmcgYXQgcG9zaXRpb24gaSBhcyBhIHNlZWQuXG4gICAgdmFyIHNlZWQgPSBsb25ndGV4dC5zdWJzdHJpbmcoaSwgaSArIE1hdGguZmxvb3IobG9uZ3RleHQubGVuZ3RoIC8gNCkpO1xuICAgIHZhciBqID0gLTE7XG4gICAgdmFyIGJlc3RfY29tbW9uID0gJyc7XG4gICAgdmFyIGJlc3RfbG9uZ3RleHRfYSwgYmVzdF9sb25ndGV4dF9iLCBiZXN0X3Nob3J0dGV4dF9hLCBiZXN0X3Nob3J0dGV4dF9iO1xuICAgIHdoaWxlICgoaiA9IHNob3J0dGV4dC5pbmRleE9mKHNlZWQsIGogKyAxKSkgIT0gLTEpIHtcbiAgICAgIHZhciBwcmVmaXhMZW5ndGggPSBkbXAuZGlmZl9jb21tb25QcmVmaXgobG9uZ3RleHQuc3Vic3RyaW5nKGkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG9ydHRleHQuc3Vic3RyaW5nKGopKTtcbiAgICAgIHZhciBzdWZmaXhMZW5ndGggPSBkbXAuZGlmZl9jb21tb25TdWZmaXgobG9uZ3RleHQuc3Vic3RyaW5nKDAsIGkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG9ydHRleHQuc3Vic3RyaW5nKDAsIGopKTtcbiAgICAgIGlmIChiZXN0X2NvbW1vbi5sZW5ndGggPCBzdWZmaXhMZW5ndGggKyBwcmVmaXhMZW5ndGgpIHtcbiAgICAgICAgYmVzdF9jb21tb24gPSBzaG9ydHRleHQuc3Vic3RyaW5nKGogLSBzdWZmaXhMZW5ndGgsIGopICtcbiAgICAgICAgICAgIHNob3J0dGV4dC5zdWJzdHJpbmcoaiwgaiArIHByZWZpeExlbmd0aCk7XG4gICAgICAgIGJlc3RfbG9uZ3RleHRfYSA9IGxvbmd0ZXh0LnN1YnN0cmluZygwLCBpIC0gc3VmZml4TGVuZ3RoKTtcbiAgICAgICAgYmVzdF9sb25ndGV4dF9iID0gbG9uZ3RleHQuc3Vic3RyaW5nKGkgKyBwcmVmaXhMZW5ndGgpO1xuICAgICAgICBiZXN0X3Nob3J0dGV4dF9hID0gc2hvcnR0ZXh0LnN1YnN0cmluZygwLCBqIC0gc3VmZml4TGVuZ3RoKTtcbiAgICAgICAgYmVzdF9zaG9ydHRleHRfYiA9IHNob3J0dGV4dC5zdWJzdHJpbmcoaiArIHByZWZpeExlbmd0aCk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChiZXN0X2NvbW1vbi5sZW5ndGggKiAyID49IGxvbmd0ZXh0Lmxlbmd0aCkge1xuICAgICAgcmV0dXJuIFtiZXN0X2xvbmd0ZXh0X2EsIGJlc3RfbG9uZ3RleHRfYixcbiAgICAgICAgICAgICAgYmVzdF9zaG9ydHRleHRfYSwgYmVzdF9zaG9ydHRleHRfYiwgYmVzdF9jb21tb25dO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvLyBGaXJzdCBjaGVjayBpZiB0aGUgc2Vjb25kIHF1YXJ0ZXIgaXMgdGhlIHNlZWQgZm9yIGEgaGFsZi1tYXRjaC5cbiAgdmFyIGhtMSA9IGRpZmZfaGFsZk1hdGNoSV8obG9uZ3RleHQsIHNob3J0dGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5jZWlsKGxvbmd0ZXh0Lmxlbmd0aCAvIDQpKTtcbiAgLy8gQ2hlY2sgYWdhaW4gYmFzZWQgb24gdGhlIHRoaXJkIHF1YXJ0ZXIuXG4gIHZhciBobTIgPSBkaWZmX2hhbGZNYXRjaElfKGxvbmd0ZXh0LCBzaG9ydHRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGguY2VpbChsb25ndGV4dC5sZW5ndGggLyAyKSk7XG4gIHZhciBobTtcbiAgaWYgKCFobTEgJiYgIWhtMikge1xuICAgIHJldHVybiBudWxsO1xuICB9IGVsc2UgaWYgKCFobTIpIHtcbiAgICBobSA9IGhtMTtcbiAgfSBlbHNlIGlmICghaG0xKSB7XG4gICAgaG0gPSBobTI7XG4gIH0gZWxzZSB7XG4gICAgLy8gQm90aCBtYXRjaGVkLiAgU2VsZWN0IHRoZSBsb25nZXN0LlxuICAgIGhtID0gaG0xWzRdLmxlbmd0aCA+IGhtMls0XS5sZW5ndGggPyBobTEgOiBobTI7XG4gIH1cblxuICAvLyBBIGhhbGYtbWF0Y2ggd2FzIGZvdW5kLCBzb3J0IG91dCB0aGUgcmV0dXJuIGRhdGEuXG4gIHZhciB0ZXh0MV9hLCB0ZXh0MV9iLCB0ZXh0Ml9hLCB0ZXh0Ml9iO1xuICBpZiAodGV4dDEubGVuZ3RoID4gdGV4dDIubGVuZ3RoKSB7XG4gICAgdGV4dDFfYSA9IGhtWzBdO1xuICAgIHRleHQxX2IgPSBobVsxXTtcbiAgICB0ZXh0Ml9hID0gaG1bMl07XG4gICAgdGV4dDJfYiA9IGhtWzNdO1xuICB9IGVsc2Uge1xuICAgIHRleHQyX2EgPSBobVswXTtcbiAgICB0ZXh0Ml9iID0gaG1bMV07XG4gICAgdGV4dDFfYSA9IGhtWzJdO1xuICAgIHRleHQxX2IgPSBobVszXTtcbiAgfVxuICB2YXIgbWlkX2NvbW1vbiA9IGhtWzRdO1xuICByZXR1cm4gW3RleHQxX2EsIHRleHQxX2IsIHRleHQyX2EsIHRleHQyX2IsIG1pZF9jb21tb25dO1xufTtcblxuXG4vKipcbiAqIFJlZHVjZSB0aGUgbnVtYmVyIG9mIGVkaXRzIGJ5IGVsaW1pbmF0aW5nIHNlbWFudGljYWxseSB0cml2aWFsIGVxdWFsaXRpZXMuXG4gKiBAcGFyYW0geyFBcnJheS48IWRpZmZfbWF0Y2hfcGF0Y2guRGlmZj59IGRpZmZzIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxuICovXG5kaWZmX21hdGNoX3BhdGNoLnByb3RvdHlwZS5kaWZmX2NsZWFudXBTZW1hbnRpYyA9IGZ1bmN0aW9uKGRpZmZzKSB7XG4gIHZhciBjaGFuZ2VzID0gZmFsc2U7XG4gIHZhciBlcXVhbGl0aWVzID0gW107ICAvLyBTdGFjayBvZiBpbmRpY2VzIHdoZXJlIGVxdWFsaXRpZXMgYXJlIGZvdW5kLlxuICB2YXIgZXF1YWxpdGllc0xlbmd0aCA9IDA7ICAvLyBLZWVwaW5nIG91ciBvd24gbGVuZ3RoIHZhciBpcyBmYXN0ZXIgaW4gSlMuXG4gIC8qKiBAdHlwZSB7P3N0cmluZ30gKi9cbiAgdmFyIGxhc3RlcXVhbGl0eSA9IG51bGw7ICAvLyBBbHdheXMgZXF1YWwgdG8gZXF1YWxpdGllc1tlcXVhbGl0aWVzTGVuZ3RoLTFdWzFdXG4gIHZhciBwb2ludGVyID0gMDsgIC8vIEluZGV4IG9mIGN1cnJlbnQgcG9zaXRpb24uXG4gIC8vIE51bWJlciBvZiBjaGFyYWN0ZXJzIHRoYXQgY2hhbmdlZCBwcmlvciB0byB0aGUgZXF1YWxpdHkuXG4gIHZhciBsZW5ndGhfaW5zZXJ0aW9uczEgPSAwO1xuICB2YXIgbGVuZ3RoX2RlbGV0aW9uczEgPSAwO1xuICAvLyBOdW1iZXIgb2YgY2hhcmFjdGVycyB0aGF0IGNoYW5nZWQgYWZ0ZXIgdGhlIGVxdWFsaXR5LlxuICB2YXIgbGVuZ3RoX2luc2VydGlvbnMyID0gMDtcbiAgdmFyIGxlbmd0aF9kZWxldGlvbnMyID0gMDtcbiAgd2hpbGUgKHBvaW50ZXIgPCBkaWZmcy5sZW5ndGgpIHtcbiAgICBpZiAoZGlmZnNbcG9pbnRlcl1bMF0gPT0gRElGRl9FUVVBTCkgeyAgLy8gRXF1YWxpdHkgZm91bmQuXG4gICAgICBlcXVhbGl0aWVzW2VxdWFsaXRpZXNMZW5ndGgrK10gPSBwb2ludGVyO1xuICAgICAgbGVuZ3RoX2luc2VydGlvbnMxID0gbGVuZ3RoX2luc2VydGlvbnMyO1xuICAgICAgbGVuZ3RoX2RlbGV0aW9uczEgPSBsZW5ndGhfZGVsZXRpb25zMjtcbiAgICAgIGxlbmd0aF9pbnNlcnRpb25zMiA9IDA7XG4gICAgICBsZW5ndGhfZGVsZXRpb25zMiA9IDA7XG4gICAgICBsYXN0ZXF1YWxpdHkgPSAvKiogQHR5cGUge3N0cmluZ30gKi8oZGlmZnNbcG9pbnRlcl1bMV0pO1xuICAgIH0gZWxzZSB7ICAvLyBBbiBpbnNlcnRpb24gb3IgZGVsZXRpb24uXG4gICAgICBpZiAoZGlmZnNbcG9pbnRlcl1bMF0gPT0gRElGRl9JTlNFUlQpIHtcbiAgICAgICAgbGVuZ3RoX2luc2VydGlvbnMyICs9IGRpZmZzW3BvaW50ZXJdWzFdLmxlbmd0aDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxlbmd0aF9kZWxldGlvbnMyICs9IGRpZmZzW3BvaW50ZXJdWzFdLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIC8vIEVsaW1pbmF0ZSBhbiBlcXVhbGl0eSB0aGF0IGlzIHNtYWxsZXIgb3IgZXF1YWwgdG8gdGhlIGVkaXRzIG9uIGJvdGhcbiAgICAgIC8vIHNpZGVzIG9mIGl0LlxuICAgICAgaWYgKGxhc3RlcXVhbGl0eSAhPT0gbnVsbCAmJiAobGFzdGVxdWFsaXR5Lmxlbmd0aCA8PVxuICAgICAgICAgIE1hdGgubWF4KGxlbmd0aF9pbnNlcnRpb25zMSwgbGVuZ3RoX2RlbGV0aW9uczEpKSAmJlxuICAgICAgICAgIChsYXN0ZXF1YWxpdHkubGVuZ3RoIDw9IE1hdGgubWF4KGxlbmd0aF9pbnNlcnRpb25zMixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZW5ndGhfZGVsZXRpb25zMikpKSB7XG4gICAgICAgIC8vIER1cGxpY2F0ZSByZWNvcmQuXG4gICAgICAgIGRpZmZzLnNwbGljZShlcXVhbGl0aWVzW2VxdWFsaXRpZXNMZW5ndGggLSAxXSwgMCxcbiAgICAgICAgICAgICAgICAgICAgIFtESUZGX0RFTEVURSwgbGFzdGVxdWFsaXR5XSk7XG4gICAgICAgIC8vIENoYW5nZSBzZWNvbmQgY29weSB0byBpbnNlcnQuXG4gICAgICAgIGRpZmZzW2VxdWFsaXRpZXNbZXF1YWxpdGllc0xlbmd0aCAtIDFdICsgMV1bMF0gPSBESUZGX0lOU0VSVDtcbiAgICAgICAgLy8gVGhyb3cgYXdheSB0aGUgZXF1YWxpdHkgd2UganVzdCBkZWxldGVkLlxuICAgICAgICBlcXVhbGl0aWVzTGVuZ3RoLS07XG4gICAgICAgIC8vIFRocm93IGF3YXkgdGhlIHByZXZpb3VzIGVxdWFsaXR5IChpdCBuZWVkcyB0byBiZSByZWV2YWx1YXRlZCkuXG4gICAgICAgIGVxdWFsaXRpZXNMZW5ndGgtLTtcbiAgICAgICAgcG9pbnRlciA9IGVxdWFsaXRpZXNMZW5ndGggPiAwID8gZXF1YWxpdGllc1tlcXVhbGl0aWVzTGVuZ3RoIC0gMV0gOiAtMTtcbiAgICAgICAgbGVuZ3RoX2luc2VydGlvbnMxID0gMDsgIC8vIFJlc2V0IHRoZSBjb3VudGVycy5cbiAgICAgICAgbGVuZ3RoX2RlbGV0aW9uczEgPSAwO1xuICAgICAgICBsZW5ndGhfaW5zZXJ0aW9uczIgPSAwO1xuICAgICAgICBsZW5ndGhfZGVsZXRpb25zMiA9IDA7XG4gICAgICAgIGxhc3RlcXVhbGl0eSA9IG51bGw7XG4gICAgICAgIGNoYW5nZXMgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICBwb2ludGVyKys7XG4gIH1cblxuICAvLyBOb3JtYWxpemUgdGhlIGRpZmYuXG4gIGlmIChjaGFuZ2VzKSB7XG4gICAgdGhpcy5kaWZmX2NsZWFudXBNZXJnZShkaWZmcyk7XG4gIH1cbiAgdGhpcy5kaWZmX2NsZWFudXBTZW1hbnRpY0xvc3NsZXNzKGRpZmZzKTtcblxuICAvLyBGaW5kIGFueSBvdmVybGFwcyBiZXR3ZWVuIGRlbGV0aW9ucyBhbmQgaW5zZXJ0aW9ucy5cbiAgLy8gZS5nOiA8ZGVsPmFiY3h4eDwvZGVsPjxpbnM+eHh4ZGVmPC9pbnM+XG4gIC8vICAgLT4gPGRlbD5hYmM8L2RlbD54eHg8aW5zPmRlZjwvaW5zPlxuICAvLyBPbmx5IGV4dHJhY3QgYW4gb3ZlcmxhcCBpZiBpdCBpcyBhcyBiaWcgYXMgdGhlIGVkaXQgYWhlYWQgb3IgYmVoaW5kIGl0LlxuICBwb2ludGVyID0gMTtcbiAgd2hpbGUgKHBvaW50ZXIgPCBkaWZmcy5sZW5ndGgpIHtcbiAgICBpZiAoZGlmZnNbcG9pbnRlciAtIDFdWzBdID09IERJRkZfREVMRVRFICYmXG4gICAgICAgIGRpZmZzW3BvaW50ZXJdWzBdID09IERJRkZfSU5TRVJUKSB7XG4gICAgICB2YXIgZGVsZXRpb24gPSAvKiogQHR5cGUge3N0cmluZ30gKi8oZGlmZnNbcG9pbnRlciAtIDFdWzFdKTtcbiAgICAgIHZhciBpbnNlcnRpb24gPSAvKiogQHR5cGUge3N0cmluZ30gKi8oZGlmZnNbcG9pbnRlcl1bMV0pO1xuICAgICAgdmFyIG92ZXJsYXBfbGVuZ3RoID0gdGhpcy5kaWZmX2NvbW1vbk92ZXJsYXBfKGRlbGV0aW9uLCBpbnNlcnRpb24pO1xuICAgICAgaWYgKG92ZXJsYXBfbGVuZ3RoID49IGRlbGV0aW9uLmxlbmd0aCAvIDIgfHxcbiAgICAgICAgICBvdmVybGFwX2xlbmd0aCA+PSBpbnNlcnRpb24ubGVuZ3RoIC8gMikge1xuICAgICAgICAvLyBPdmVybGFwIGZvdW5kLiAgSW5zZXJ0IGFuIGVxdWFsaXR5IGFuZCB0cmltIHRoZSBzdXJyb3VuZGluZyBlZGl0cy5cbiAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIsIDAsXG4gICAgICAgICAgICBbRElGRl9FUVVBTCwgaW5zZXJ0aW9uLnN1YnN0cmluZygwLCBvdmVybGFwX2xlbmd0aCldKTtcbiAgICAgICAgZGlmZnNbcG9pbnRlciAtIDFdWzFdID1cbiAgICAgICAgICAgIGRlbGV0aW9uLnN1YnN0cmluZygwLCBkZWxldGlvbi5sZW5ndGggLSBvdmVybGFwX2xlbmd0aCk7XG4gICAgICAgIGRpZmZzW3BvaW50ZXIgKyAxXVsxXSA9IGluc2VydGlvbi5zdWJzdHJpbmcob3ZlcmxhcF9sZW5ndGgpO1xuICAgICAgICBwb2ludGVyKys7XG4gICAgICB9XG4gICAgICBwb2ludGVyKys7XG4gICAgfVxuICAgIHBvaW50ZXIrKztcbiAgfVxufTtcblxuXG4vKipcbiAqIExvb2sgZm9yIHNpbmdsZSBlZGl0cyBzdXJyb3VuZGVkIG9uIGJvdGggc2lkZXMgYnkgZXF1YWxpdGllc1xuICogd2hpY2ggY2FuIGJlIHNoaWZ0ZWQgc2lkZXdheXMgdG8gYWxpZ24gdGhlIGVkaXQgdG8gYSB3b3JkIGJvdW5kYXJ5LlxuICogZS5nOiBUaGUgYzxpbnM+YXQgYzwvaW5zPmFtZS4gLT4gVGhlIDxpbnM+Y2F0IDwvaW5zPmNhbWUuXG4gKiBAcGFyYW0geyFBcnJheS48IWRpZmZfbWF0Y2hfcGF0Y2guRGlmZj59IGRpZmZzIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxuICovXG5kaWZmX21hdGNoX3BhdGNoLnByb3RvdHlwZS5kaWZmX2NsZWFudXBTZW1hbnRpY0xvc3NsZXNzID0gZnVuY3Rpb24oZGlmZnMpIHtcbiAgLy8gRGVmaW5lIHNvbWUgcmVnZXggcGF0dGVybnMgZm9yIG1hdGNoaW5nIGJvdW5kYXJpZXMuXG4gIHZhciBwdW5jdHVhdGlvbiA9IC9bXmEtekEtWjAtOV0vO1xuICB2YXIgd2hpdGVzcGFjZSA9IC9cXHMvO1xuICB2YXIgbGluZWJyZWFrID0gL1tcXHJcXG5dLztcbiAgdmFyIGJsYW5rbGluZUVuZCA9IC9cXG5cXHI/XFxuJC87XG4gIHZhciBibGFua2xpbmVTdGFydCA9IC9eXFxyP1xcblxccj9cXG4vO1xuXG4gIC8qKlxuICAgKiBHaXZlbiB0d28gc3RyaW5ncywgY29tcHV0ZSBhIHNjb3JlIHJlcHJlc2VudGluZyB3aGV0aGVyIHRoZSBpbnRlcm5hbFxuICAgKiBib3VuZGFyeSBmYWxscyBvbiBsb2dpY2FsIGJvdW5kYXJpZXMuXG4gICAqIFNjb3JlcyByYW5nZSBmcm9tIDUgKGJlc3QpIHRvIDAgKHdvcnN0KS5cbiAgICogQ2xvc3VyZSwgbWFrZXMgcmVmZXJlbmNlIHRvIHJlZ2V4IHBhdHRlcm5zIGRlZmluZWQgYWJvdmUuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvbmUgRmlyc3Qgc3RyaW5nLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHdvIFNlY29uZCBzdHJpbmcuXG4gICAqIEByZXR1cm4ge251bWJlcn0gVGhlIHNjb3JlLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gZGlmZl9jbGVhbnVwU2VtYW50aWNTY29yZV8ob25lLCB0d28pIHtcbiAgICBpZiAoIW9uZSB8fCAhdHdvKSB7XG4gICAgICAvLyBFZGdlcyBhcmUgdGhlIGJlc3QuXG4gICAgICByZXR1cm4gNTtcbiAgICB9XG5cbiAgICAvLyBFYWNoIHBvcnQgb2YgdGhpcyBmdW5jdGlvbiBiZWhhdmVzIHNsaWdodGx5IGRpZmZlcmVudGx5IGR1ZSB0b1xuICAgIC8vIHN1YnRsZSBkaWZmZXJlbmNlcyBpbiBlYWNoIGxhbmd1YWdlJ3MgZGVmaW5pdGlvbiBvZiB0aGluZ3MgbGlrZVxuICAgIC8vICd3aGl0ZXNwYWNlJy4gIFNpbmNlIHRoaXMgZnVuY3Rpb24ncyBwdXJwb3NlIGlzIGxhcmdlbHkgY29zbWV0aWMsXG4gICAgLy8gdGhlIGNob2ljZSBoYXMgYmVlbiBtYWRlIHRvIHVzZSBlYWNoIGxhbmd1YWdlJ3MgbmF0aXZlIGZlYXR1cmVzXG4gICAgLy8gcmF0aGVyIHRoYW4gZm9yY2UgdG90YWwgY29uZm9ybWl0eS5cbiAgICB2YXIgc2NvcmUgPSAwO1xuICAgIC8vIE9uZSBwb2ludCBmb3Igbm9uLWFscGhhbnVtZXJpYy5cbiAgICBpZiAob25lLmNoYXJBdChvbmUubGVuZ3RoIC0gMSkubWF0Y2gocHVuY3R1YXRpb24pIHx8XG4gICAgICAgIHR3by5jaGFyQXQoMCkubWF0Y2gocHVuY3R1YXRpb24pKSB7XG4gICAgICBzY29yZSsrO1xuICAgICAgLy8gVHdvIHBvaW50cyBmb3Igd2hpdGVzcGFjZS5cbiAgICAgIGlmIChvbmUuY2hhckF0KG9uZS5sZW5ndGggLSAxKS5tYXRjaCh3aGl0ZXNwYWNlKSB8fFxuICAgICAgICAgIHR3by5jaGFyQXQoMCkubWF0Y2god2hpdGVzcGFjZSkpIHtcbiAgICAgICAgc2NvcmUrKztcbiAgICAgICAgLy8gVGhyZWUgcG9pbnRzIGZvciBsaW5lIGJyZWFrcy5cbiAgICAgICAgaWYgKG9uZS5jaGFyQXQob25lLmxlbmd0aCAtIDEpLm1hdGNoKGxpbmVicmVhaykgfHxcbiAgICAgICAgICAgIHR3by5jaGFyQXQoMCkubWF0Y2gobGluZWJyZWFrKSkge1xuICAgICAgICAgIHNjb3JlKys7XG4gICAgICAgICAgLy8gRm91ciBwb2ludHMgZm9yIGJsYW5rIGxpbmVzLlxuICAgICAgICAgIGlmIChvbmUubWF0Y2goYmxhbmtsaW5lRW5kKSB8fCB0d28ubWF0Y2goYmxhbmtsaW5lU3RhcnQpKSB7XG4gICAgICAgICAgICBzY29yZSsrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc2NvcmU7XG4gIH1cblxuICB2YXIgcG9pbnRlciA9IDE7XG4gIC8vIEludGVudGlvbmFsbHkgaWdub3JlIHRoZSBmaXJzdCBhbmQgbGFzdCBlbGVtZW50IChkb24ndCBuZWVkIGNoZWNraW5nKS5cbiAgd2hpbGUgKHBvaW50ZXIgPCBkaWZmcy5sZW5ndGggLSAxKSB7XG4gICAgaWYgKGRpZmZzW3BvaW50ZXIgLSAxXVswXSA9PSBESUZGX0VRVUFMICYmXG4gICAgICAgIGRpZmZzW3BvaW50ZXIgKyAxXVswXSA9PSBESUZGX0VRVUFMKSB7XG4gICAgICAvLyBUaGlzIGlzIGEgc2luZ2xlIGVkaXQgc3Vycm91bmRlZCBieSBlcXVhbGl0aWVzLlxuICAgICAgdmFyIGVxdWFsaXR5MSA9IC8qKiBAdHlwZSB7c3RyaW5nfSAqLyhkaWZmc1twb2ludGVyIC0gMV1bMV0pO1xuICAgICAgdmFyIGVkaXQgPSAvKiogQHR5cGUge3N0cmluZ30gKi8oZGlmZnNbcG9pbnRlcl1bMV0pO1xuICAgICAgdmFyIGVxdWFsaXR5MiA9IC8qKiBAdHlwZSB7c3RyaW5nfSAqLyhkaWZmc1twb2ludGVyICsgMV1bMV0pO1xuXG4gICAgICAvLyBGaXJzdCwgc2hpZnQgdGhlIGVkaXQgYXMgZmFyIGxlZnQgYXMgcG9zc2libGUuXG4gICAgICB2YXIgY29tbW9uT2Zmc2V0ID0gdGhpcy5kaWZmX2NvbW1vblN1ZmZpeChlcXVhbGl0eTEsIGVkaXQpO1xuICAgICAgaWYgKGNvbW1vbk9mZnNldCkge1xuICAgICAgICB2YXIgY29tbW9uU3RyaW5nID0gZWRpdC5zdWJzdHJpbmcoZWRpdC5sZW5ndGggLSBjb21tb25PZmZzZXQpO1xuICAgICAgICBlcXVhbGl0eTEgPSBlcXVhbGl0eTEuc3Vic3RyaW5nKDAsIGVxdWFsaXR5MS5sZW5ndGggLSBjb21tb25PZmZzZXQpO1xuICAgICAgICBlZGl0ID0gY29tbW9uU3RyaW5nICsgZWRpdC5zdWJzdHJpbmcoMCwgZWRpdC5sZW5ndGggLSBjb21tb25PZmZzZXQpO1xuICAgICAgICBlcXVhbGl0eTIgPSBjb21tb25TdHJpbmcgKyBlcXVhbGl0eTI7XG4gICAgICB9XG5cbiAgICAgIC8vIFNlY29uZCwgc3RlcCBjaGFyYWN0ZXIgYnkgY2hhcmFjdGVyIHJpZ2h0LCBsb29raW5nIGZvciB0aGUgYmVzdCBmaXQuXG4gICAgICB2YXIgYmVzdEVxdWFsaXR5MSA9IGVxdWFsaXR5MTtcbiAgICAgIHZhciBiZXN0RWRpdCA9IGVkaXQ7XG4gICAgICB2YXIgYmVzdEVxdWFsaXR5MiA9IGVxdWFsaXR5MjtcbiAgICAgIHZhciBiZXN0U2NvcmUgPSBkaWZmX2NsZWFudXBTZW1hbnRpY1Njb3JlXyhlcXVhbGl0eTEsIGVkaXQpICtcbiAgICAgICAgICBkaWZmX2NsZWFudXBTZW1hbnRpY1Njb3JlXyhlZGl0LCBlcXVhbGl0eTIpO1xuICAgICAgd2hpbGUgKGVkaXQuY2hhckF0KDApID09PSBlcXVhbGl0eTIuY2hhckF0KDApKSB7XG4gICAgICAgIGVxdWFsaXR5MSArPSBlZGl0LmNoYXJBdCgwKTtcbiAgICAgICAgZWRpdCA9IGVkaXQuc3Vic3RyaW5nKDEpICsgZXF1YWxpdHkyLmNoYXJBdCgwKTtcbiAgICAgICAgZXF1YWxpdHkyID0gZXF1YWxpdHkyLnN1YnN0cmluZygxKTtcbiAgICAgICAgdmFyIHNjb3JlID0gZGlmZl9jbGVhbnVwU2VtYW50aWNTY29yZV8oZXF1YWxpdHkxLCBlZGl0KSArXG4gICAgICAgICAgICBkaWZmX2NsZWFudXBTZW1hbnRpY1Njb3JlXyhlZGl0LCBlcXVhbGl0eTIpO1xuICAgICAgICAvLyBUaGUgPj0gZW5jb3VyYWdlcyB0cmFpbGluZyByYXRoZXIgdGhhbiBsZWFkaW5nIHdoaXRlc3BhY2Ugb24gZWRpdHMuXG4gICAgICAgIGlmIChzY29yZSA+PSBiZXN0U2NvcmUpIHtcbiAgICAgICAgICBiZXN0U2NvcmUgPSBzY29yZTtcbiAgICAgICAgICBiZXN0RXF1YWxpdHkxID0gZXF1YWxpdHkxO1xuICAgICAgICAgIGJlc3RFZGl0ID0gZWRpdDtcbiAgICAgICAgICBiZXN0RXF1YWxpdHkyID0gZXF1YWxpdHkyO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChkaWZmc1twb2ludGVyIC0gMV1bMV0gIT0gYmVzdEVxdWFsaXR5MSkge1xuICAgICAgICAvLyBXZSBoYXZlIGFuIGltcHJvdmVtZW50LCBzYXZlIGl0IGJhY2sgdG8gdGhlIGRpZmYuXG4gICAgICAgIGlmIChiZXN0RXF1YWxpdHkxKSB7XG4gICAgICAgICAgZGlmZnNbcG9pbnRlciAtIDFdWzFdID0gYmVzdEVxdWFsaXR5MTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkaWZmcy5zcGxpY2UocG9pbnRlciAtIDEsIDEpO1xuICAgICAgICAgIHBvaW50ZXItLTtcbiAgICAgICAgfVxuICAgICAgICBkaWZmc1twb2ludGVyXVsxXSA9IGJlc3RFZGl0O1xuICAgICAgICBpZiAoYmVzdEVxdWFsaXR5Mikge1xuICAgICAgICAgIGRpZmZzW3BvaW50ZXIgKyAxXVsxXSA9IGJlc3RFcXVhbGl0eTI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIgKyAxLCAxKTtcbiAgICAgICAgICBwb2ludGVyLS07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcG9pbnRlcisrO1xuICB9XG59O1xuXG5cbi8qKlxuICogUmVkdWNlIHRoZSBudW1iZXIgb2YgZWRpdHMgYnkgZWxpbWluYXRpbmcgb3BlcmF0aW9uYWxseSB0cml2aWFsIGVxdWFsaXRpZXMuXG4gKiBAcGFyYW0geyFBcnJheS48IWRpZmZfbWF0Y2hfcGF0Y2guRGlmZj59IGRpZmZzIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxuICovXG5kaWZmX21hdGNoX3BhdGNoLnByb3RvdHlwZS5kaWZmX2NsZWFudXBFZmZpY2llbmN5ID0gZnVuY3Rpb24oZGlmZnMpIHtcbiAgdmFyIGNoYW5nZXMgPSBmYWxzZTtcbiAgdmFyIGVxdWFsaXRpZXMgPSBbXTsgIC8vIFN0YWNrIG9mIGluZGljZXMgd2hlcmUgZXF1YWxpdGllcyBhcmUgZm91bmQuXG4gIHZhciBlcXVhbGl0aWVzTGVuZ3RoID0gMDsgIC8vIEtlZXBpbmcgb3VyIG93biBsZW5ndGggdmFyIGlzIGZhc3RlciBpbiBKUy5cbiAgdmFyIGxhc3RlcXVhbGl0eSA9ICcnOyAgLy8gQWx3YXlzIGVxdWFsIHRvIGVxdWFsaXRpZXNbZXF1YWxpdGllc0xlbmd0aC0xXVsxXVxuICB2YXIgcG9pbnRlciA9IDA7ICAvLyBJbmRleCBvZiBjdXJyZW50IHBvc2l0aW9uLlxuICAvLyBJcyB0aGVyZSBhbiBpbnNlcnRpb24gb3BlcmF0aW9uIGJlZm9yZSB0aGUgbGFzdCBlcXVhbGl0eS5cbiAgdmFyIHByZV9pbnMgPSBmYWxzZTtcbiAgLy8gSXMgdGhlcmUgYSBkZWxldGlvbiBvcGVyYXRpb24gYmVmb3JlIHRoZSBsYXN0IGVxdWFsaXR5LlxuICB2YXIgcHJlX2RlbCA9IGZhbHNlO1xuICAvLyBJcyB0aGVyZSBhbiBpbnNlcnRpb24gb3BlcmF0aW9uIGFmdGVyIHRoZSBsYXN0IGVxdWFsaXR5LlxuICB2YXIgcG9zdF9pbnMgPSBmYWxzZTtcbiAgLy8gSXMgdGhlcmUgYSBkZWxldGlvbiBvcGVyYXRpb24gYWZ0ZXIgdGhlIGxhc3QgZXF1YWxpdHkuXG4gIHZhciBwb3N0X2RlbCA9IGZhbHNlO1xuICB3aGlsZSAocG9pbnRlciA8IGRpZmZzLmxlbmd0aCkge1xuICAgIGlmIChkaWZmc1twb2ludGVyXVswXSA9PSBESUZGX0VRVUFMKSB7ICAvLyBFcXVhbGl0eSBmb3VuZC5cbiAgICAgIGlmIChkaWZmc1twb2ludGVyXVsxXS5sZW5ndGggPCB0aGlzLkRpZmZfRWRpdENvc3QgJiZcbiAgICAgICAgICAocG9zdF9pbnMgfHwgcG9zdF9kZWwpKSB7XG4gICAgICAgIC8vIENhbmRpZGF0ZSBmb3VuZC5cbiAgICAgICAgZXF1YWxpdGllc1tlcXVhbGl0aWVzTGVuZ3RoKytdID0gcG9pbnRlcjtcbiAgICAgICAgcHJlX2lucyA9IHBvc3RfaW5zO1xuICAgICAgICBwcmVfZGVsID0gcG9zdF9kZWw7XG4gICAgICAgIGxhc3RlcXVhbGl0eSA9IGRpZmZzW3BvaW50ZXJdWzFdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gTm90IGEgY2FuZGlkYXRlLCBhbmQgY2FuIG5ldmVyIGJlY29tZSBvbmUuXG4gICAgICAgIGVxdWFsaXRpZXNMZW5ndGggPSAwO1xuICAgICAgICBsYXN0ZXF1YWxpdHkgPSAnJztcbiAgICAgIH1cbiAgICAgIHBvc3RfaW5zID0gcG9zdF9kZWwgPSBmYWxzZTtcbiAgICB9IGVsc2UgeyAgLy8gQW4gaW5zZXJ0aW9uIG9yIGRlbGV0aW9uLlxuICAgICAgaWYgKGRpZmZzW3BvaW50ZXJdWzBdID09IERJRkZfREVMRVRFKSB7XG4gICAgICAgIHBvc3RfZGVsID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBvc3RfaW5zID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIC8qXG4gICAgICAgKiBGaXZlIHR5cGVzIHRvIGJlIHNwbGl0OlxuICAgICAgICogPGlucz5BPC9pbnM+PGRlbD5CPC9kZWw+WFk8aW5zPkM8L2lucz48ZGVsPkQ8L2RlbD5cbiAgICAgICAqIDxpbnM+QTwvaW5zPlg8aW5zPkM8L2lucz48ZGVsPkQ8L2RlbD5cbiAgICAgICAqIDxpbnM+QTwvaW5zPjxkZWw+QjwvZGVsPlg8aW5zPkM8L2lucz5cbiAgICAgICAqIDxpbnM+QTwvZGVsPlg8aW5zPkM8L2lucz48ZGVsPkQ8L2RlbD5cbiAgICAgICAqIDxpbnM+QTwvaW5zPjxkZWw+QjwvZGVsPlg8ZGVsPkM8L2RlbD5cbiAgICAgICAqL1xuICAgICAgaWYgKGxhc3RlcXVhbGl0eSAmJiAoKHByZV9pbnMgJiYgcHJlX2RlbCAmJiBwb3N0X2lucyAmJiBwb3N0X2RlbCkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICgobGFzdGVxdWFsaXR5Lmxlbmd0aCA8IHRoaXMuRGlmZl9FZGl0Q29zdCAvIDIpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKHByZV9pbnMgKyBwcmVfZGVsICsgcG9zdF9pbnMgKyBwb3N0X2RlbCkgPT0gMykpKSB7XG4gICAgICAgIC8vIER1cGxpY2F0ZSByZWNvcmQuXG4gICAgICAgIGRpZmZzLnNwbGljZShlcXVhbGl0aWVzW2VxdWFsaXRpZXNMZW5ndGggLSAxXSwgMCxcbiAgICAgICAgICAgICAgICAgICAgIFtESUZGX0RFTEVURSwgbGFzdGVxdWFsaXR5XSk7XG4gICAgICAgIC8vIENoYW5nZSBzZWNvbmQgY29weSB0byBpbnNlcnQuXG4gICAgICAgIGRpZmZzW2VxdWFsaXRpZXNbZXF1YWxpdGllc0xlbmd0aCAtIDFdICsgMV1bMF0gPSBESUZGX0lOU0VSVDtcbiAgICAgICAgZXF1YWxpdGllc0xlbmd0aC0tOyAgLy8gVGhyb3cgYXdheSB0aGUgZXF1YWxpdHkgd2UganVzdCBkZWxldGVkO1xuICAgICAgICBsYXN0ZXF1YWxpdHkgPSAnJztcbiAgICAgICAgaWYgKHByZV9pbnMgJiYgcHJlX2RlbCkge1xuICAgICAgICAgIC8vIE5vIGNoYW5nZXMgbWFkZSB3aGljaCBjb3VsZCBhZmZlY3QgcHJldmlvdXMgZW50cnksIGtlZXAgZ29pbmcuXG4gICAgICAgICAgcG9zdF9pbnMgPSBwb3N0X2RlbCA9IHRydWU7XG4gICAgICAgICAgZXF1YWxpdGllc0xlbmd0aCA9IDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZXF1YWxpdGllc0xlbmd0aC0tOyAgLy8gVGhyb3cgYXdheSB0aGUgcHJldmlvdXMgZXF1YWxpdHkuXG4gICAgICAgICAgcG9pbnRlciA9IGVxdWFsaXRpZXNMZW5ndGggPiAwID9cbiAgICAgICAgICAgICAgZXF1YWxpdGllc1tlcXVhbGl0aWVzTGVuZ3RoIC0gMV0gOiAtMTtcbiAgICAgICAgICBwb3N0X2lucyA9IHBvc3RfZGVsID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgY2hhbmdlcyA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHBvaW50ZXIrKztcbiAgfVxuXG4gIGlmIChjaGFuZ2VzKSB7XG4gICAgdGhpcy5kaWZmX2NsZWFudXBNZXJnZShkaWZmcyk7XG4gIH1cbn07XG5cblxuLyoqXG4gKiBSZW9yZGVyIGFuZCBtZXJnZSBsaWtlIGVkaXQgc2VjdGlvbnMuICBNZXJnZSBlcXVhbGl0aWVzLlxuICogQW55IGVkaXQgc2VjdGlvbiBjYW4gbW92ZSBhcyBsb25nIGFzIGl0IGRvZXNuJ3QgY3Jvc3MgYW4gZXF1YWxpdHkuXG4gKiBAcGFyYW0geyFBcnJheS48IWRpZmZfbWF0Y2hfcGF0Y2guRGlmZj59IGRpZmZzIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxuICovXG5kaWZmX21hdGNoX3BhdGNoLnByb3RvdHlwZS5kaWZmX2NsZWFudXBNZXJnZSA9IGZ1bmN0aW9uKGRpZmZzKSB7XG4gIGRpZmZzLnB1c2goW0RJRkZfRVFVQUwsICcnXSk7ICAvLyBBZGQgYSBkdW1teSBlbnRyeSBhdCB0aGUgZW5kLlxuICB2YXIgcG9pbnRlciA9IDA7XG4gIHZhciBjb3VudF9kZWxldGUgPSAwO1xuICB2YXIgY291bnRfaW5zZXJ0ID0gMDtcbiAgdmFyIHRleHRfZGVsZXRlID0gJyc7XG4gIHZhciB0ZXh0X2luc2VydCA9ICcnO1xuICB2YXIgY29tbW9ubGVuZ3RoO1xuICB3aGlsZSAocG9pbnRlciA8IGRpZmZzLmxlbmd0aCkge1xuICAgIHN3aXRjaCAoZGlmZnNbcG9pbnRlcl1bMF0pIHtcbiAgICAgIGNhc2UgRElGRl9JTlNFUlQ6XG4gICAgICAgIGNvdW50X2luc2VydCsrO1xuICAgICAgICB0ZXh0X2luc2VydCArPSBkaWZmc1twb2ludGVyXVsxXTtcbiAgICAgICAgcG9pbnRlcisrO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgRElGRl9ERUxFVEU6XG4gICAgICAgIGNvdW50X2RlbGV0ZSsrO1xuICAgICAgICB0ZXh0X2RlbGV0ZSArPSBkaWZmc1twb2ludGVyXVsxXTtcbiAgICAgICAgcG9pbnRlcisrO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgRElGRl9FUVVBTDpcbiAgICAgICAgLy8gVXBvbiByZWFjaGluZyBhbiBlcXVhbGl0eSwgY2hlY2sgZm9yIHByaW9yIHJlZHVuZGFuY2llcy5cbiAgICAgICAgaWYgKGNvdW50X2RlbGV0ZSArIGNvdW50X2luc2VydCA+IDEpIHtcbiAgICAgICAgICBpZiAoY291bnRfZGVsZXRlICE9PSAwICYmIGNvdW50X2luc2VydCAhPT0gMCkge1xuICAgICAgICAgICAgLy8gRmFjdG9yIG91dCBhbnkgY29tbW9uIHByZWZpeGllcy5cbiAgICAgICAgICAgIGNvbW1vbmxlbmd0aCA9IHRoaXMuZGlmZl9jb21tb25QcmVmaXgodGV4dF9pbnNlcnQsIHRleHRfZGVsZXRlKTtcbiAgICAgICAgICAgIGlmIChjb21tb25sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgICAgaWYgKChwb2ludGVyIC0gY291bnRfZGVsZXRlIC0gY291bnRfaW5zZXJ0KSA+IDAgJiZcbiAgICAgICAgICAgICAgICAgIGRpZmZzW3BvaW50ZXIgLSBjb3VudF9kZWxldGUgLSBjb3VudF9pbnNlcnQgLSAxXVswXSA9PVxuICAgICAgICAgICAgICAgICAgRElGRl9FUVVBTCkge1xuICAgICAgICAgICAgICAgIGRpZmZzW3BvaW50ZXIgLSBjb3VudF9kZWxldGUgLSBjb3VudF9pbnNlcnQgLSAxXVsxXSArPVxuICAgICAgICAgICAgICAgICAgICB0ZXh0X2luc2VydC5zdWJzdHJpbmcoMCwgY29tbW9ubGVuZ3RoKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaWZmcy5zcGxpY2UoMCwgMCwgW0RJRkZfRVFVQUwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0X2luc2VydC5zdWJzdHJpbmcoMCwgY29tbW9ubGVuZ3RoKV0pO1xuICAgICAgICAgICAgICAgIHBvaW50ZXIrKztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB0ZXh0X2luc2VydCA9IHRleHRfaW5zZXJ0LnN1YnN0cmluZyhjb21tb25sZW5ndGgpO1xuICAgICAgICAgICAgICB0ZXh0X2RlbGV0ZSA9IHRleHRfZGVsZXRlLnN1YnN0cmluZyhjb21tb25sZW5ndGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gRmFjdG9yIG91dCBhbnkgY29tbW9uIHN1ZmZpeGllcy5cbiAgICAgICAgICAgIGNvbW1vbmxlbmd0aCA9IHRoaXMuZGlmZl9jb21tb25TdWZmaXgodGV4dF9pbnNlcnQsIHRleHRfZGVsZXRlKTtcbiAgICAgICAgICAgIGlmIChjb21tb25sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgICAgZGlmZnNbcG9pbnRlcl1bMV0gPSB0ZXh0X2luc2VydC5zdWJzdHJpbmcodGV4dF9pbnNlcnQubGVuZ3RoIC1cbiAgICAgICAgICAgICAgICAgIGNvbW1vbmxlbmd0aCkgKyBkaWZmc1twb2ludGVyXVsxXTtcbiAgICAgICAgICAgICAgdGV4dF9pbnNlcnQgPSB0ZXh0X2luc2VydC5zdWJzdHJpbmcoMCwgdGV4dF9pbnNlcnQubGVuZ3RoIC1cbiAgICAgICAgICAgICAgICAgIGNvbW1vbmxlbmd0aCk7XG4gICAgICAgICAgICAgIHRleHRfZGVsZXRlID0gdGV4dF9kZWxldGUuc3Vic3RyaW5nKDAsIHRleHRfZGVsZXRlLmxlbmd0aCAtXG4gICAgICAgICAgICAgICAgICBjb21tb25sZW5ndGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBEZWxldGUgdGhlIG9mZmVuZGluZyByZWNvcmRzIGFuZCBhZGQgdGhlIG1lcmdlZCBvbmVzLlxuICAgICAgICAgIGlmIChjb3VudF9kZWxldGUgPT09IDApIHtcbiAgICAgICAgICAgIGRpZmZzLnNwbGljZShwb2ludGVyIC0gY291bnRfZGVsZXRlIC0gY291bnRfaW5zZXJ0LFxuICAgICAgICAgICAgICAgIGNvdW50X2RlbGV0ZSArIGNvdW50X2luc2VydCwgW0RJRkZfSU5TRVJULCB0ZXh0X2luc2VydF0pO1xuICAgICAgICAgIH0gZWxzZSBpZiAoY291bnRfaW5zZXJ0ID09PSAwKSB7XG4gICAgICAgICAgICBkaWZmcy5zcGxpY2UocG9pbnRlciAtIGNvdW50X2RlbGV0ZSAtIGNvdW50X2luc2VydCxcbiAgICAgICAgICAgICAgICBjb3VudF9kZWxldGUgKyBjb3VudF9pbnNlcnQsIFtESUZGX0RFTEVURSwgdGV4dF9kZWxldGVdKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIgLSBjb3VudF9kZWxldGUgLSBjb3VudF9pbnNlcnQsXG4gICAgICAgICAgICAgICAgY291bnRfZGVsZXRlICsgY291bnRfaW5zZXJ0LCBbRElGRl9ERUxFVEUsIHRleHRfZGVsZXRlXSxcbiAgICAgICAgICAgICAgICBbRElGRl9JTlNFUlQsIHRleHRfaW5zZXJ0XSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHBvaW50ZXIgPSBwb2ludGVyIC0gY291bnRfZGVsZXRlIC0gY291bnRfaW5zZXJ0ICtcbiAgICAgICAgICAgICAgICAgICAgKGNvdW50X2RlbGV0ZSA/IDEgOiAwKSArIChjb3VudF9pbnNlcnQgPyAxIDogMCkgKyAxO1xuICAgICAgICB9IGVsc2UgaWYgKHBvaW50ZXIgIT09IDAgJiYgZGlmZnNbcG9pbnRlciAtIDFdWzBdID09IERJRkZfRVFVQUwpIHtcbiAgICAgICAgICAvLyBNZXJnZSB0aGlzIGVxdWFsaXR5IHdpdGggdGhlIHByZXZpb3VzIG9uZS5cbiAgICAgICAgICBkaWZmc1twb2ludGVyIC0gMV1bMV0gKz0gZGlmZnNbcG9pbnRlcl1bMV07XG4gICAgICAgICAgZGlmZnMuc3BsaWNlKHBvaW50ZXIsIDEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBvaW50ZXIrKztcbiAgICAgICAgfVxuICAgICAgICBjb3VudF9pbnNlcnQgPSAwO1xuICAgICAgICBjb3VudF9kZWxldGUgPSAwO1xuICAgICAgICB0ZXh0X2RlbGV0ZSA9ICcnO1xuICAgICAgICB0ZXh0X2luc2VydCA9ICcnO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgaWYgKGRpZmZzW2RpZmZzLmxlbmd0aCAtIDFdWzFdID09PSAnJykge1xuICAgIGRpZmZzLnBvcCgpOyAgLy8gUmVtb3ZlIHRoZSBkdW1teSBlbnRyeSBhdCB0aGUgZW5kLlxuICB9XG5cbiAgLy8gU2Vjb25kIHBhc3M6IGxvb2sgZm9yIHNpbmdsZSBlZGl0cyBzdXJyb3VuZGVkIG9uIGJvdGggc2lkZXMgYnkgZXF1YWxpdGllc1xuICAvLyB3aGljaCBjYW4gYmUgc2hpZnRlZCBzaWRld2F5cyB0byBlbGltaW5hdGUgYW4gZXF1YWxpdHkuXG4gIC8vIGUuZzogQTxpbnM+QkE8L2lucz5DIC0+IDxpbnM+QUI8L2lucz5BQ1xuICB2YXIgY2hhbmdlcyA9IGZhbHNlO1xuICBwb2ludGVyID0gMTtcbiAgLy8gSW50ZW50aW9uYWxseSBpZ25vcmUgdGhlIGZpcnN0IGFuZCBsYXN0IGVsZW1lbnQgKGRvbid0IG5lZWQgY2hlY2tpbmcpLlxuICB3aGlsZSAocG9pbnRlciA8IGRpZmZzLmxlbmd0aCAtIDEpIHtcbiAgICBpZiAoZGlmZnNbcG9pbnRlciAtIDFdWzBdID09IERJRkZfRVFVQUwgJiZcbiAgICAgICAgZGlmZnNbcG9pbnRlciArIDFdWzBdID09IERJRkZfRVFVQUwpIHtcbiAgICAgIC8vIFRoaXMgaXMgYSBzaW5nbGUgZWRpdCBzdXJyb3VuZGVkIGJ5IGVxdWFsaXRpZXMuXG4gICAgICBpZiAoZGlmZnNbcG9pbnRlcl1bMV0uc3Vic3RyaW5nKGRpZmZzW3BvaW50ZXJdWzFdLmxlbmd0aCAtXG4gICAgICAgICAgZGlmZnNbcG9pbnRlciAtIDFdWzFdLmxlbmd0aCkgPT0gZGlmZnNbcG9pbnRlciAtIDFdWzFdKSB7XG4gICAgICAgIC8vIFNoaWZ0IHRoZSBlZGl0IG92ZXIgdGhlIHByZXZpb3VzIGVxdWFsaXR5LlxuICAgICAgICBkaWZmc1twb2ludGVyXVsxXSA9IGRpZmZzW3BvaW50ZXIgLSAxXVsxXSArXG4gICAgICAgICAgICBkaWZmc1twb2ludGVyXVsxXS5zdWJzdHJpbmcoMCwgZGlmZnNbcG9pbnRlcl1bMV0ubGVuZ3RoIC1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWZmc1twb2ludGVyIC0gMV1bMV0ubGVuZ3RoKTtcbiAgICAgICAgZGlmZnNbcG9pbnRlciArIDFdWzFdID0gZGlmZnNbcG9pbnRlciAtIDFdWzFdICsgZGlmZnNbcG9pbnRlciArIDFdWzFdO1xuICAgICAgICBkaWZmcy5zcGxpY2UocG9pbnRlciAtIDEsIDEpO1xuICAgICAgICBjaGFuZ2VzID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAoZGlmZnNbcG9pbnRlcl1bMV0uc3Vic3RyaW5nKDAsIGRpZmZzW3BvaW50ZXIgKyAxXVsxXS5sZW5ndGgpID09XG4gICAgICAgICAgZGlmZnNbcG9pbnRlciArIDFdWzFdKSB7XG4gICAgICAgIC8vIFNoaWZ0IHRoZSBlZGl0IG92ZXIgdGhlIG5leHQgZXF1YWxpdHkuXG4gICAgICAgIGRpZmZzW3BvaW50ZXIgLSAxXVsxXSArPSBkaWZmc1twb2ludGVyICsgMV1bMV07XG4gICAgICAgIGRpZmZzW3BvaW50ZXJdWzFdID1cbiAgICAgICAgICAgIGRpZmZzW3BvaW50ZXJdWzFdLnN1YnN0cmluZyhkaWZmc1twb2ludGVyICsgMV1bMV0ubGVuZ3RoKSArXG4gICAgICAgICAgICBkaWZmc1twb2ludGVyICsgMV1bMV07XG4gICAgICAgIGRpZmZzLnNwbGljZShwb2ludGVyICsgMSwgMSk7XG4gICAgICAgIGNoYW5nZXMgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICBwb2ludGVyKys7XG4gIH1cbiAgLy8gSWYgc2hpZnRzIHdlcmUgbWFkZSwgdGhlIGRpZmYgbmVlZHMgcmVvcmRlcmluZyBhbmQgYW5vdGhlciBzaGlmdCBzd2VlcC5cbiAgaWYgKGNoYW5nZXMpIHtcbiAgICB0aGlzLmRpZmZfY2xlYW51cE1lcmdlKGRpZmZzKTtcbiAgfVxufTtcblxuXG4vKipcbiAqIGxvYyBpcyBhIGxvY2F0aW9uIGluIHRleHQxLCBjb21wdXRlIGFuZCByZXR1cm4gdGhlIGVxdWl2YWxlbnQgbG9jYXRpb24gaW5cbiAqIHRleHQyLlxuICogZS5nLiAnVGhlIGNhdCcgdnMgJ1RoZSBiaWcgY2F0JywgMS0+MSwgNS0+OFxuICogQHBhcmFtIHshQXJyYXkuPCFkaWZmX21hdGNoX3BhdGNoLkRpZmY+fSBkaWZmcyBBcnJheSBvZiBkaWZmIHR1cGxlcy5cbiAqIEBwYXJhbSB7bnVtYmVyfSBsb2MgTG9jYXRpb24gd2l0aGluIHRleHQxLlxuICogQHJldHVybiB7bnVtYmVyfSBMb2NhdGlvbiB3aXRoaW4gdGV4dDIuXG4gKi9cbmRpZmZfbWF0Y2hfcGF0Y2gucHJvdG90eXBlLmRpZmZfeEluZGV4ID0gZnVuY3Rpb24oZGlmZnMsIGxvYykge1xuICB2YXIgY2hhcnMxID0gMDtcbiAgdmFyIGNoYXJzMiA9IDA7XG4gIHZhciBsYXN0X2NoYXJzMSA9IDA7XG4gIHZhciBsYXN0X2NoYXJzMiA9IDA7XG4gIHZhciB4O1xuICBmb3IgKHggPSAwOyB4IDwgZGlmZnMubGVuZ3RoOyB4KyspIHtcbiAgICBpZiAoZGlmZnNbeF1bMF0gIT09IERJRkZfSU5TRVJUKSB7ICAvLyBFcXVhbGl0eSBvciBkZWxldGlvbi5cbiAgICAgIGNoYXJzMSArPSBkaWZmc1t4XVsxXS5sZW5ndGg7XG4gICAgfVxuICAgIGlmIChkaWZmc1t4XVswXSAhPT0gRElGRl9ERUxFVEUpIHsgIC8vIEVxdWFsaXR5IG9yIGluc2VydGlvbi5cbiAgICAgIGNoYXJzMiArPSBkaWZmc1t4XVsxXS5sZW5ndGg7XG4gICAgfVxuICAgIGlmIChjaGFyczEgPiBsb2MpIHsgIC8vIE92ZXJzaG90IHRoZSBsb2NhdGlvbi5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBsYXN0X2NoYXJzMSA9IGNoYXJzMTtcbiAgICBsYXN0X2NoYXJzMiA9IGNoYXJzMjtcbiAgfVxuICAvLyBXYXMgdGhlIGxvY2F0aW9uIHdhcyBkZWxldGVkP1xuICBpZiAoZGlmZnMubGVuZ3RoICE9IHggJiYgZGlmZnNbeF1bMF0gPT09IERJRkZfREVMRVRFKSB7XG4gICAgcmV0dXJuIGxhc3RfY2hhcnMyO1xuICB9XG4gIC8vIEFkZCB0aGUgcmVtYWluaW5nIGNoYXJhY3RlciBsZW5ndGguXG4gIHJldHVybiBsYXN0X2NoYXJzMiArIChsb2MgLSBsYXN0X2NoYXJzMSk7XG59O1xuXG5cbi8qKlxuICogQ29udmVydCBhIGRpZmYgYXJyYXkgaW50byBhIHByZXR0eSBIVE1MIHJlcG9ydC5cbiAqIEBwYXJhbSB7IUFycmF5LjwhZGlmZl9tYXRjaF9wYXRjaC5EaWZmPn0gZGlmZnMgQXJyYXkgb2YgZGlmZiB0dXBsZXMuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IEhUTUwgcmVwcmVzZW50YXRpb24uXG4gKi9cbmRpZmZfbWF0Y2hfcGF0Y2gucHJvdG90eXBlLmRpZmZfcHJldHR5SHRtbCA9IGZ1bmN0aW9uKGRpZmZzKSB7XG4gIHZhciBodG1sID0gW107XG4gIHZhciBpID0gMDtcbiAgdmFyIHBhdHRlcm5fYW1wID0gLyYvZztcbiAgdmFyIHBhdHRlcm5fbHQgPSAvPC9nO1xuICB2YXIgcGF0dGVybl9ndCA9IC8+L2c7XG4gIHZhciBwYXR0ZXJuX3BhcmEgPSAvXFxuL2c7XG4gIGZvciAodmFyIHggPSAwOyB4IDwgZGlmZnMubGVuZ3RoOyB4KyspIHtcbiAgICB2YXIgb3AgPSBkaWZmc1t4XVswXTsgICAgLy8gT3BlcmF0aW9uIChpbnNlcnQsIGRlbGV0ZSwgZXF1YWwpXG4gICAgdmFyIGRhdGEgPSBkaWZmc1t4XVsxXTsgIC8vIFRleHQgb2YgY2hhbmdlLlxuICAgIHZhciB0ZXh0ID0gZGF0YS5yZXBsYWNlKHBhdHRlcm5fYW1wLCAnJmFtcDsnKS5yZXBsYWNlKHBhdHRlcm5fbHQsICcmbHQ7JylcbiAgICAgICAgLnJlcGxhY2UocGF0dGVybl9ndCwgJyZndDsnKS5yZXBsYWNlKHBhdHRlcm5fcGFyYSwgJyZwYXJhOzxicj4nKTtcbiAgICBzd2l0Y2ggKG9wKSB7XG4gICAgICBjYXNlIERJRkZfSU5TRVJUOlxuICAgICAgICBodG1sW3hdID0gJzxpbnMgc3R5bGU9XCJiYWNrZ3JvdW5kOiNlNmZmZTY7XCI+JyArIHRleHQgKyAnPC9pbnM+JztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIERJRkZfREVMRVRFOlxuICAgICAgICBodG1sW3hdID0gJzxkZWwgc3R5bGU9XCJiYWNrZ3JvdW5kOiNmZmU2ZTY7XCI+JyArIHRleHQgKyAnPC9kZWw+JztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIERJRkZfRVFVQUw6XG4gICAgICAgIGh0bWxbeF0gPSAnPHNwYW4+JyArIHRleHQgKyAnPC9zcGFuPic7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpZiAob3AgIT09IERJRkZfREVMRVRFKSB7XG4gICAgICBpICs9IGRhdGEubGVuZ3RoO1xuICAgIH1cbiAgfVxuICByZXR1cm4gaHRtbC5qb2luKCcnKTtcbn07XG5cblxuLyoqXG4gKiBDb21wdXRlIGFuZCByZXR1cm4gdGhlIHNvdXJjZSB0ZXh0IChhbGwgZXF1YWxpdGllcyBhbmQgZGVsZXRpb25zKS5cbiAqIEBwYXJhbSB7IUFycmF5LjwhZGlmZl9tYXRjaF9wYXRjaC5EaWZmPn0gZGlmZnMgQXJyYXkgb2YgZGlmZiB0dXBsZXMuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IFNvdXJjZSB0ZXh0LlxuICovXG5kaWZmX21hdGNoX3BhdGNoLnByb3RvdHlwZS5kaWZmX3RleHQxID0gZnVuY3Rpb24oZGlmZnMpIHtcbiAgdmFyIHRleHQgPSBbXTtcbiAgZm9yICh2YXIgeCA9IDA7IHggPCBkaWZmcy5sZW5ndGg7IHgrKykge1xuICAgIGlmIChkaWZmc1t4XVswXSAhPT0gRElGRl9JTlNFUlQpIHtcbiAgICAgIHRleHRbeF0gPSBkaWZmc1t4XVsxXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRleHQuam9pbignJyk7XG59O1xuXG5cbi8qKlxuICogQ29tcHV0ZSBhbmQgcmV0dXJuIHRoZSBkZXN0aW5hdGlvbiB0ZXh0IChhbGwgZXF1YWxpdGllcyBhbmQgaW5zZXJ0aW9ucykuXG4gKiBAcGFyYW0geyFBcnJheS48IWRpZmZfbWF0Y2hfcGF0Y2guRGlmZj59IGRpZmZzIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxuICogQHJldHVybiB7c3RyaW5nfSBEZXN0aW5hdGlvbiB0ZXh0LlxuICovXG5kaWZmX21hdGNoX3BhdGNoLnByb3RvdHlwZS5kaWZmX3RleHQyID0gZnVuY3Rpb24oZGlmZnMpIHtcbiAgdmFyIHRleHQgPSBbXTtcbiAgZm9yICh2YXIgeCA9IDA7IHggPCBkaWZmcy5sZW5ndGg7IHgrKykge1xuICAgIGlmIChkaWZmc1t4XVswXSAhPT0gRElGRl9ERUxFVEUpIHtcbiAgICAgIHRleHRbeF0gPSBkaWZmc1t4XVsxXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRleHQuam9pbignJyk7XG59O1xuXG5cbi8qKlxuICogQ29tcHV0ZSB0aGUgTGV2ZW5zaHRlaW4gZGlzdGFuY2U7IHRoZSBudW1iZXIgb2YgaW5zZXJ0ZWQsIGRlbGV0ZWQgb3JcbiAqIHN1YnN0aXR1dGVkIGNoYXJhY3RlcnMuXG4gKiBAcGFyYW0geyFBcnJheS48IWRpZmZfbWF0Y2hfcGF0Y2guRGlmZj59IGRpZmZzIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxuICogQHJldHVybiB7bnVtYmVyfSBOdW1iZXIgb2YgY2hhbmdlcy5cbiAqL1xuZGlmZl9tYXRjaF9wYXRjaC5wcm90b3R5cGUuZGlmZl9sZXZlbnNodGVpbiA9IGZ1bmN0aW9uKGRpZmZzKSB7XG4gIHZhciBsZXZlbnNodGVpbiA9IDA7XG4gIHZhciBpbnNlcnRpb25zID0gMDtcbiAgdmFyIGRlbGV0aW9ucyA9IDA7XG4gIGZvciAodmFyIHggPSAwOyB4IDwgZGlmZnMubGVuZ3RoOyB4KyspIHtcbiAgICB2YXIgb3AgPSBkaWZmc1t4XVswXTtcbiAgICB2YXIgZGF0YSA9IGRpZmZzW3hdWzFdO1xuICAgIHN3aXRjaCAob3ApIHtcbiAgICAgIGNhc2UgRElGRl9JTlNFUlQ6XG4gICAgICAgIGluc2VydGlvbnMgKz0gZGF0YS5sZW5ndGg7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBESUZGX0RFTEVURTpcbiAgICAgICAgZGVsZXRpb25zICs9IGRhdGEubGVuZ3RoO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgRElGRl9FUVVBTDpcbiAgICAgICAgLy8gQSBkZWxldGlvbiBhbmQgYW4gaW5zZXJ0aW9uIGlzIG9uZSBzdWJzdGl0dXRpb24uXG4gICAgICAgIGxldmVuc2h0ZWluICs9IE1hdGgubWF4KGluc2VydGlvbnMsIGRlbGV0aW9ucyk7XG4gICAgICAgIGluc2VydGlvbnMgPSAwO1xuICAgICAgICBkZWxldGlvbnMgPSAwO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgbGV2ZW5zaHRlaW4gKz0gTWF0aC5tYXgoaW5zZXJ0aW9ucywgZGVsZXRpb25zKTtcbiAgcmV0dXJuIGxldmVuc2h0ZWluO1xufTtcblxuXG4vKipcbiAqIENydXNoIHRoZSBkaWZmIGludG8gYW4gZW5jb2RlZCBzdHJpbmcgd2hpY2ggZGVzY3JpYmVzIHRoZSBvcGVyYXRpb25zXG4gKiByZXF1aXJlZCB0byB0cmFuc2Zvcm0gdGV4dDEgaW50byB0ZXh0Mi5cbiAqIEUuZy4gPTNcXHQtMlxcdCtpbmcgIC0+IEtlZXAgMyBjaGFycywgZGVsZXRlIDIgY2hhcnMsIGluc2VydCAnaW5nJy5cbiAqIE9wZXJhdGlvbnMgYXJlIHRhYi1zZXBhcmF0ZWQuICBJbnNlcnRlZCB0ZXh0IGlzIGVzY2FwZWQgdXNpbmcgJXh4IG5vdGF0aW9uLlxuICogQHBhcmFtIHshQXJyYXkuPCFkaWZmX21hdGNoX3BhdGNoLkRpZmY+fSBkaWZmcyBBcnJheSBvZiBkaWZmIHR1cGxlcy5cbiAqIEByZXR1cm4ge3N0cmluZ30gRGVsdGEgdGV4dC5cbiAqL1xuZGlmZl9tYXRjaF9wYXRjaC5wcm90b3R5cGUuZGlmZl90b0RlbHRhID0gZnVuY3Rpb24oZGlmZnMpIHtcbiAgdmFyIHRleHQgPSBbXTtcbiAgZm9yICh2YXIgeCA9IDA7IHggPCBkaWZmcy5sZW5ndGg7IHgrKykge1xuICAgIHN3aXRjaCAoZGlmZnNbeF1bMF0pIHtcbiAgICAgIGNhc2UgRElGRl9JTlNFUlQ6XG4gICAgICAgIHRleHRbeF0gPSAnKycgKyBlbmNvZGVVUkkoZGlmZnNbeF1bMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgRElGRl9ERUxFVEU6XG4gICAgICAgIHRleHRbeF0gPSAnLScgKyBkaWZmc1t4XVsxXS5sZW5ndGg7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBESUZGX0VRVUFMOlxuICAgICAgICB0ZXh0W3hdID0gJz0nICsgZGlmZnNbeF1bMV0ubGVuZ3RoO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRleHQuam9pbignXFx0JykucmVwbGFjZSgvJTIwL2csICcgJyk7XG59O1xuXG5cbi8qKlxuICogR2l2ZW4gdGhlIG9yaWdpbmFsIHRleHQxLCBhbmQgYW4gZW5jb2RlZCBzdHJpbmcgd2hpY2ggZGVzY3JpYmVzIHRoZVxuICogb3BlcmF0aW9ucyByZXF1aXJlZCB0byB0cmFuc2Zvcm0gdGV4dDEgaW50byB0ZXh0MiwgY29tcHV0ZSB0aGUgZnVsbCBkaWZmLlxuICogQHBhcmFtIHtzdHJpbmd9IHRleHQxIFNvdXJjZSBzdHJpbmcgZm9yIHRoZSBkaWZmLlxuICogQHBhcmFtIHtzdHJpbmd9IGRlbHRhIERlbHRhIHRleHQuXG4gKiBAcmV0dXJuIHshQXJyYXkuPCFkaWZmX21hdGNoX3BhdGNoLkRpZmY+fSBBcnJheSBvZiBkaWZmIHR1cGxlcy5cbiAqIEB0aHJvd3MgeyFFcnJvcn0gSWYgaW52YWxpZCBpbnB1dC5cbiAqL1xuZGlmZl9tYXRjaF9wYXRjaC5wcm90b3R5cGUuZGlmZl9mcm9tRGVsdGEgPSBmdW5jdGlvbih0ZXh0MSwgZGVsdGEpIHtcbiAgdmFyIGRpZmZzID0gW107XG4gIHZhciBkaWZmc0xlbmd0aCA9IDA7ICAvLyBLZWVwaW5nIG91ciBvd24gbGVuZ3RoIHZhciBpcyBmYXN0ZXIgaW4gSlMuXG4gIHZhciBwb2ludGVyID0gMDsgIC8vIEN1cnNvciBpbiB0ZXh0MVxuICB2YXIgdG9rZW5zID0gZGVsdGEuc3BsaXQoL1xcdC9nKTtcbiAgZm9yICh2YXIgeCA9IDA7IHggPCB0b2tlbnMubGVuZ3RoOyB4KyspIHtcbiAgICAvLyBFYWNoIHRva2VuIGJlZ2lucyB3aXRoIGEgb25lIGNoYXJhY3RlciBwYXJhbWV0ZXIgd2hpY2ggc3BlY2lmaWVzIHRoZVxuICAgIC8vIG9wZXJhdGlvbiBvZiB0aGlzIHRva2VuIChkZWxldGUsIGluc2VydCwgZXF1YWxpdHkpLlxuICAgIHZhciBwYXJhbSA9IHRva2Vuc1t4XS5zdWJzdHJpbmcoMSk7XG4gICAgc3dpdGNoICh0b2tlbnNbeF0uY2hhckF0KDApKSB7XG4gICAgICBjYXNlICcrJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBkaWZmc1tkaWZmc0xlbmd0aCsrXSA9IFtESUZGX0lOU0VSVCwgZGVjb2RlVVJJKHBhcmFtKV07XG4gICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgLy8gTWFsZm9ybWVkIFVSSSBzZXF1ZW5jZS5cbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0lsbGVnYWwgZXNjYXBlIGluIGRpZmZfZnJvbURlbHRhOiAnICsgcGFyYW0pO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnLSc6XG4gICAgICAgIC8vIEZhbGwgdGhyb3VnaC5cbiAgICAgIGNhc2UgJz0nOlxuICAgICAgICB2YXIgbiA9IHBhcnNlSW50KHBhcmFtLCAxMCk7XG4gICAgICAgIGlmIChpc05hTihuKSB8fCBuIDwgMCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBudW1iZXIgaW4gZGlmZl9mcm9tRGVsdGE6ICcgKyBwYXJhbSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHRleHQgPSB0ZXh0MS5zdWJzdHJpbmcocG9pbnRlciwgcG9pbnRlciArPSBuKTtcbiAgICAgICAgaWYgKHRva2Vuc1t4XS5jaGFyQXQoMCkgPT0gJz0nKSB7XG4gICAgICAgICAgZGlmZnNbZGlmZnNMZW5ndGgrK10gPSBbRElGRl9FUVVBTCwgdGV4dF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGlmZnNbZGlmZnNMZW5ndGgrK10gPSBbRElGRl9ERUxFVEUsIHRleHRdO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgLy8gQmxhbmsgdG9rZW5zIGFyZSBvayAoZnJvbSBhIHRyYWlsaW5nIFxcdCkuXG4gICAgICAgIC8vIEFueXRoaW5nIGVsc2UgaXMgYW4gZXJyb3IuXG4gICAgICAgIGlmICh0b2tlbnNbeF0pIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgZGlmZiBvcGVyYXRpb24gaW4gZGlmZl9mcm9tRGVsdGE6ICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnNbeF0pO1xuICAgICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChwb2ludGVyICE9IHRleHQxLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBFcnJvcignRGVsdGEgbGVuZ3RoICgnICsgcG9pbnRlciArXG4gICAgICAgICcpIGRvZXMgbm90IGVxdWFsIHNvdXJjZSB0ZXh0IGxlbmd0aCAoJyArIHRleHQxLmxlbmd0aCArICcpLicpO1xuICB9XG4gIHJldHVybiBkaWZmcztcbn07XG5cblxuLy8gIE1BVENIIEZVTkNUSU9OU1xuXG5cbi8qKlxuICogTG9jYXRlIHRoZSBiZXN0IGluc3RhbmNlIG9mICdwYXR0ZXJuJyBpbiAndGV4dCcgbmVhciAnbG9jJy5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IFRoZSB0ZXh0IHRvIHNlYXJjaC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXR0ZXJuIFRoZSBwYXR0ZXJuIHRvIHNlYXJjaCBmb3IuXG4gKiBAcGFyYW0ge251bWJlcn0gbG9jIFRoZSBsb2NhdGlvbiB0byBzZWFyY2ggYXJvdW5kLlxuICogQHJldHVybiB7bnVtYmVyfSBCZXN0IG1hdGNoIGluZGV4IG9yIC0xLlxuICovXG5kaWZmX21hdGNoX3BhdGNoLnByb3RvdHlwZS5tYXRjaF9tYWluID0gZnVuY3Rpb24odGV4dCwgcGF0dGVybiwgbG9jKSB7XG4gIC8vIENoZWNrIGZvciBudWxsIGlucHV0cy5cbiAgaWYgKHRleHQgPT0gbnVsbCB8fCBwYXR0ZXJuID09IG51bGwgfHwgbG9jID09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ051bGwgaW5wdXQuIChtYXRjaF9tYWluKScpO1xuICB9XG5cbiAgbG9jID0gTWF0aC5tYXgoMCwgTWF0aC5taW4obG9jLCB0ZXh0Lmxlbmd0aCkpO1xuICBpZiAodGV4dCA9PSBwYXR0ZXJuKSB7XG4gICAgLy8gU2hvcnRjdXQgKHBvdGVudGlhbGx5IG5vdCBndWFyYW50ZWVkIGJ5IHRoZSBhbGdvcml0aG0pXG4gICAgcmV0dXJuIDA7XG4gIH0gZWxzZSBpZiAoIXRleHQubGVuZ3RoKSB7XG4gICAgLy8gTm90aGluZyB0byBtYXRjaC5cbiAgICByZXR1cm4gLTE7XG4gIH0gZWxzZSBpZiAodGV4dC5zdWJzdHJpbmcobG9jLCBsb2MgKyBwYXR0ZXJuLmxlbmd0aCkgPT0gcGF0dGVybikge1xuICAgIC8vIFBlcmZlY3QgbWF0Y2ggYXQgdGhlIHBlcmZlY3Qgc3BvdCEgIChJbmNsdWRlcyBjYXNlIG9mIG51bGwgcGF0dGVybilcbiAgICByZXR1cm4gbG9jO1xuICB9IGVsc2Uge1xuICAgIC8vIERvIGEgZnV6enkgY29tcGFyZS5cbiAgICByZXR1cm4gdGhpcy5tYXRjaF9iaXRhcF8odGV4dCwgcGF0dGVybiwgbG9jKTtcbiAgfVxufTtcblxuXG4vKipcbiAqIExvY2F0ZSB0aGUgYmVzdCBpbnN0YW5jZSBvZiAncGF0dGVybicgaW4gJ3RleHQnIG5lYXIgJ2xvYycgdXNpbmcgdGhlXG4gKiBCaXRhcCBhbGdvcml0aG0uXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dCBUaGUgdGV4dCB0byBzZWFyY2guXG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0dGVybiBUaGUgcGF0dGVybiB0byBzZWFyY2ggZm9yLlxuICogQHBhcmFtIHtudW1iZXJ9IGxvYyBUaGUgbG9jYXRpb24gdG8gc2VhcmNoIGFyb3VuZC5cbiAqIEByZXR1cm4ge251bWJlcn0gQmVzdCBtYXRjaCBpbmRleCBvciAtMS5cbiAqIEBwcml2YXRlXG4gKi9cbmRpZmZfbWF0Y2hfcGF0Y2gucHJvdG90eXBlLm1hdGNoX2JpdGFwXyA9IGZ1bmN0aW9uKHRleHQsIHBhdHRlcm4sIGxvYykge1xuICBpZiAocGF0dGVybi5sZW5ndGggPiB0aGlzLk1hdGNoX01heEJpdHMpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1BhdHRlcm4gdG9vIGxvbmcgZm9yIHRoaXMgYnJvd3Nlci4nKTtcbiAgfVxuXG4gIC8vIEluaXRpYWxpc2UgdGhlIGFscGhhYmV0LlxuICB2YXIgcyA9IHRoaXMubWF0Y2hfYWxwaGFiZXRfKHBhdHRlcm4pO1xuXG4gIHZhciBkbXAgPSB0aGlzOyAgLy8gJ3RoaXMnIGJlY29tZXMgJ3dpbmRvdycgaW4gYSBjbG9zdXJlLlxuXG4gIC8qKlxuICAgKiBDb21wdXRlIGFuZCByZXR1cm4gdGhlIHNjb3JlIGZvciBhIG1hdGNoIHdpdGggZSBlcnJvcnMgYW5kIHggbG9jYXRpb24uXG4gICAqIEFjY2Vzc2VzIGxvYyBhbmQgcGF0dGVybiB0aHJvdWdoIGJlaW5nIGEgY2xvc3VyZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGUgTnVtYmVyIG9mIGVycm9ycyBpbiBtYXRjaC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IHggTG9jYXRpb24gb2YgbWF0Y2guXG4gICAqIEByZXR1cm4ge251bWJlcn0gT3ZlcmFsbCBzY29yZSBmb3IgbWF0Y2ggKDAuMCA9IGdvb2QsIDEuMCA9IGJhZCkuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBmdW5jdGlvbiBtYXRjaF9iaXRhcFNjb3JlXyhlLCB4KSB7XG4gICAgdmFyIGFjY3VyYWN5ID0gZSAvIHBhdHRlcm4ubGVuZ3RoO1xuICAgIHZhciBwcm94aW1pdHkgPSBNYXRoLmFicyhsb2MgLSB4KTtcbiAgICBpZiAoIWRtcC5NYXRjaF9EaXN0YW5jZSkge1xuICAgICAgLy8gRG9kZ2UgZGl2aWRlIGJ5IHplcm8gZXJyb3IuXG4gICAgICByZXR1cm4gcHJveGltaXR5ID8gMS4wIDogYWNjdXJhY3k7XG4gICAgfVxuICAgIHJldHVybiBhY2N1cmFjeSArIChwcm94aW1pdHkgLyBkbXAuTWF0Y2hfRGlzdGFuY2UpO1xuICB9XG5cbiAgLy8gSGlnaGVzdCBzY29yZSBiZXlvbmQgd2hpY2ggd2UgZ2l2ZSB1cC5cbiAgdmFyIHNjb3JlX3RocmVzaG9sZCA9IHRoaXMuTWF0Y2hfVGhyZXNob2xkO1xuICAvLyBJcyB0aGVyZSBhIG5lYXJieSBleGFjdCBtYXRjaD8gKHNwZWVkdXApXG4gIHZhciBiZXN0X2xvYyA9IHRleHQuaW5kZXhPZihwYXR0ZXJuLCBsb2MpO1xuICBpZiAoYmVzdF9sb2MgIT0gLTEpIHtcbiAgICBzY29yZV90aHJlc2hvbGQgPSBNYXRoLm1pbihtYXRjaF9iaXRhcFNjb3JlXygwLCBiZXN0X2xvYyksIHNjb3JlX3RocmVzaG9sZCk7XG4gICAgLy8gV2hhdCBhYm91dCBpbiB0aGUgb3RoZXIgZGlyZWN0aW9uPyAoc3BlZWR1cClcbiAgICBiZXN0X2xvYyA9IHRleHQubGFzdEluZGV4T2YocGF0dGVybiwgbG9jICsgcGF0dGVybi5sZW5ndGgpO1xuICAgIGlmIChiZXN0X2xvYyAhPSAtMSkge1xuICAgICAgc2NvcmVfdGhyZXNob2xkID1cbiAgICAgICAgICBNYXRoLm1pbihtYXRjaF9iaXRhcFNjb3JlXygwLCBiZXN0X2xvYyksIHNjb3JlX3RocmVzaG9sZCk7XG4gICAgfVxuICB9XG5cbiAgLy8gSW5pdGlhbGlzZSB0aGUgYml0IGFycmF5cy5cbiAgdmFyIG1hdGNobWFzayA9IDEgPDwgKHBhdHRlcm4ubGVuZ3RoIC0gMSk7XG4gIGJlc3RfbG9jID0gLTE7XG5cbiAgdmFyIGJpbl9taW4sIGJpbl9taWQ7XG4gIHZhciBiaW5fbWF4ID0gcGF0dGVybi5sZW5ndGggKyB0ZXh0Lmxlbmd0aDtcbiAgdmFyIGxhc3RfcmQ7XG4gIGZvciAodmFyIGQgPSAwOyBkIDwgcGF0dGVybi5sZW5ndGg7IGQrKykge1xuICAgIC8vIFNjYW4gZm9yIHRoZSBiZXN0IG1hdGNoOyBlYWNoIGl0ZXJhdGlvbiBhbGxvd3MgZm9yIG9uZSBtb3JlIGVycm9yLlxuICAgIC8vIFJ1biBhIGJpbmFyeSBzZWFyY2ggdG8gZGV0ZXJtaW5lIGhvdyBmYXIgZnJvbSAnbG9jJyB3ZSBjYW4gc3RyYXkgYXQgdGhpc1xuICAgIC8vIGVycm9yIGxldmVsLlxuICAgIGJpbl9taW4gPSAwO1xuICAgIGJpbl9taWQgPSBiaW5fbWF4O1xuICAgIHdoaWxlIChiaW5fbWluIDwgYmluX21pZCkge1xuICAgICAgaWYgKG1hdGNoX2JpdGFwU2NvcmVfKGQsIGxvYyArIGJpbl9taWQpIDw9IHNjb3JlX3RocmVzaG9sZCkge1xuICAgICAgICBiaW5fbWluID0gYmluX21pZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJpbl9tYXggPSBiaW5fbWlkO1xuICAgICAgfVxuICAgICAgYmluX21pZCA9IE1hdGguZmxvb3IoKGJpbl9tYXggLSBiaW5fbWluKSAvIDIgKyBiaW5fbWluKTtcbiAgICB9XG4gICAgLy8gVXNlIHRoZSByZXN1bHQgZnJvbSB0aGlzIGl0ZXJhdGlvbiBhcyB0aGUgbWF4aW11bSBmb3IgdGhlIG5leHQuXG4gICAgYmluX21heCA9IGJpbl9taWQ7XG4gICAgdmFyIHN0YXJ0ID0gTWF0aC5tYXgoMSwgbG9jIC0gYmluX21pZCArIDEpO1xuICAgIHZhciBmaW5pc2ggPSBNYXRoLm1pbihsb2MgKyBiaW5fbWlkLCB0ZXh0Lmxlbmd0aCkgKyBwYXR0ZXJuLmxlbmd0aDtcblxuICAgIHZhciByZCA9IEFycmF5KGZpbmlzaCArIDIpO1xuICAgIHJkW2ZpbmlzaCArIDFdID0gKDEgPDwgZCkgLSAxO1xuICAgIGZvciAodmFyIGogPSBmaW5pc2g7IGogPj0gc3RhcnQ7IGotLSkge1xuICAgICAgLy8gVGhlIGFscGhhYmV0IChzKSBpcyBhIHNwYXJzZSBoYXNoLCBzbyB0aGUgZm9sbG93aW5nIGxpbmUgZ2VuZXJhdGVzXG4gICAgICAvLyB3YXJuaW5ncy5cbiAgICAgIHZhciBjaGFyTWF0Y2ggPSBzW3RleHQuY2hhckF0KGogLSAxKV07XG4gICAgICBpZiAoZCA9PT0gMCkgeyAgLy8gRmlyc3QgcGFzczogZXhhY3QgbWF0Y2guXG4gICAgICAgIHJkW2pdID0gKChyZFtqICsgMV0gPDwgMSkgfCAxKSAmIGNoYXJNYXRjaDtcbiAgICAgIH0gZWxzZSB7ICAvLyBTdWJzZXF1ZW50IHBhc3NlczogZnV6enkgbWF0Y2guXG4gICAgICAgIHJkW2pdID0gKChyZFtqICsgMV0gPDwgMSkgfCAxKSAmIGNoYXJNYXRjaCB8XG4gICAgICAgICAgICAgICAgKCgobGFzdF9yZFtqICsgMV0gfCBsYXN0X3JkW2pdKSA8PCAxKSB8IDEpIHxcbiAgICAgICAgICAgICAgICBsYXN0X3JkW2ogKyAxXTtcbiAgICAgIH1cbiAgICAgIGlmIChyZFtqXSAmIG1hdGNobWFzaykge1xuICAgICAgICB2YXIgc2NvcmUgPSBtYXRjaF9iaXRhcFNjb3JlXyhkLCBqIC0gMSk7XG4gICAgICAgIC8vIFRoaXMgbWF0Y2ggd2lsbCBhbG1vc3QgY2VydGFpbmx5IGJlIGJldHRlciB0aGFuIGFueSBleGlzdGluZyBtYXRjaC5cbiAgICAgICAgLy8gQnV0IGNoZWNrIGFueXdheS5cbiAgICAgICAgaWYgKHNjb3JlIDw9IHNjb3JlX3RocmVzaG9sZCkge1xuICAgICAgICAgIC8vIFRvbGQgeW91IHNvLlxuICAgICAgICAgIHNjb3JlX3RocmVzaG9sZCA9IHNjb3JlO1xuICAgICAgICAgIGJlc3RfbG9jID0gaiAtIDE7XG4gICAgICAgICAgaWYgKGJlc3RfbG9jID4gbG9jKSB7XG4gICAgICAgICAgICAvLyBXaGVuIHBhc3NpbmcgbG9jLCBkb24ndCBleGNlZWQgb3VyIGN1cnJlbnQgZGlzdGFuY2UgZnJvbSBsb2MuXG4gICAgICAgICAgICBzdGFydCA9IE1hdGgubWF4KDEsIDIgKiBsb2MgLSBiZXN0X2xvYyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEFscmVhZHkgcGFzc2VkIGxvYywgZG93bmhpbGwgZnJvbSBoZXJlIG9uIGluLlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIC8vIE5vIGhvcGUgZm9yIGEgKGJldHRlcikgbWF0Y2ggYXQgZ3JlYXRlciBlcnJvciBsZXZlbHMuXG4gICAgaWYgKG1hdGNoX2JpdGFwU2NvcmVfKGQgKyAxLCBsb2MpID4gc2NvcmVfdGhyZXNob2xkKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgbGFzdF9yZCA9IHJkO1xuICB9XG4gIHJldHVybiBiZXN0X2xvYztcbn07XG5cblxuLyoqXG4gKiBJbml0aWFsaXNlIHRoZSBhbHBoYWJldCBmb3IgdGhlIEJpdGFwIGFsZ29yaXRobS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXR0ZXJuIFRoZSB0ZXh0IHRvIGVuY29kZS5cbiAqIEByZXR1cm4geyFPYmplY3R9IEhhc2ggb2YgY2hhcmFjdGVyIGxvY2F0aW9ucy5cbiAqIEBwcml2YXRlXG4gKi9cbmRpZmZfbWF0Y2hfcGF0Y2gucHJvdG90eXBlLm1hdGNoX2FscGhhYmV0XyA9IGZ1bmN0aW9uKHBhdHRlcm4pIHtcbiAgdmFyIHMgPSB7fTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXR0ZXJuLmxlbmd0aDsgaSsrKSB7XG4gICAgc1twYXR0ZXJuLmNoYXJBdChpKV0gPSAwO1xuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0dGVybi5sZW5ndGg7IGkrKykge1xuICAgIHNbcGF0dGVybi5jaGFyQXQoaSldIHw9IDEgPDwgKHBhdHRlcm4ubGVuZ3RoIC0gaSAtIDEpO1xuICB9XG4gIHJldHVybiBzO1xufTtcblxuXG4vLyAgUEFUQ0ggRlVOQ1RJT05TXG5cblxuLyoqXG4gKiBJbmNyZWFzZSB0aGUgY29udGV4dCB1bnRpbCBpdCBpcyB1bmlxdWUsXG4gKiBidXQgZG9uJ3QgbGV0IHRoZSBwYXR0ZXJuIGV4cGFuZCBiZXlvbmQgTWF0Y2hfTWF4Qml0cy5cbiAqIEBwYXJhbSB7IWRpZmZfbWF0Y2hfcGF0Y2gucGF0Y2hfb2JqfSBwYXRjaCBUaGUgcGF0Y2ggdG8gZ3Jvdy5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IFNvdXJjZSB0ZXh0LlxuICogQHByaXZhdGVcbiAqL1xuZGlmZl9tYXRjaF9wYXRjaC5wcm90b3R5cGUucGF0Y2hfYWRkQ29udGV4dF8gPSBmdW5jdGlvbihwYXRjaCwgdGV4dCkge1xuICBpZiAodGV4dC5sZW5ndGggPT0gMCkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgcGF0dGVybiA9IHRleHQuc3Vic3RyaW5nKHBhdGNoLnN0YXJ0MiwgcGF0Y2guc3RhcnQyICsgcGF0Y2gubGVuZ3RoMSk7XG4gIHZhciBwYWRkaW5nID0gMDtcblxuICAvLyBMb29rIGZvciB0aGUgZmlyc3QgYW5kIGxhc3QgbWF0Y2hlcyBvZiBwYXR0ZXJuIGluIHRleHQuICBJZiB0d28gZGlmZmVyZW50XG4gIC8vIG1hdGNoZXMgYXJlIGZvdW5kLCBpbmNyZWFzZSB0aGUgcGF0dGVybiBsZW5ndGguXG4gIHdoaWxlICh0ZXh0LmluZGV4T2YocGF0dGVybikgIT0gdGV4dC5sYXN0SW5kZXhPZihwYXR0ZXJuKSAmJlxuICAgICAgICAgcGF0dGVybi5sZW5ndGggPCB0aGlzLk1hdGNoX01heEJpdHMgLSB0aGlzLlBhdGNoX01hcmdpbiAtXG4gICAgICAgICB0aGlzLlBhdGNoX01hcmdpbikge1xuICAgIHBhZGRpbmcgKz0gdGhpcy5QYXRjaF9NYXJnaW47XG4gICAgcGF0dGVybiA9IHRleHQuc3Vic3RyaW5nKHBhdGNoLnN0YXJ0MiAtIHBhZGRpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGNoLnN0YXJ0MiArIHBhdGNoLmxlbmd0aDEgKyBwYWRkaW5nKTtcbiAgfVxuICAvLyBBZGQgb25lIGNodW5rIGZvciBnb29kIGx1Y2suXG4gIHBhZGRpbmcgKz0gdGhpcy5QYXRjaF9NYXJnaW47XG5cbiAgLy8gQWRkIHRoZSBwcmVmaXguXG4gIHZhciBwcmVmaXggPSB0ZXh0LnN1YnN0cmluZyhwYXRjaC5zdGFydDIgLSBwYWRkaW5nLCBwYXRjaC5zdGFydDIpO1xuICBpZiAocHJlZml4KSB7XG4gICAgcGF0Y2guZGlmZnMudW5zaGlmdChbRElGRl9FUVVBTCwgcHJlZml4XSk7XG4gIH1cbiAgLy8gQWRkIHRoZSBzdWZmaXguXG4gIHZhciBzdWZmaXggPSB0ZXh0LnN1YnN0cmluZyhwYXRjaC5zdGFydDIgKyBwYXRjaC5sZW5ndGgxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0Y2guc3RhcnQyICsgcGF0Y2gubGVuZ3RoMSArIHBhZGRpbmcpO1xuICBpZiAoc3VmZml4KSB7XG4gICAgcGF0Y2guZGlmZnMucHVzaChbRElGRl9FUVVBTCwgc3VmZml4XSk7XG4gIH1cblxuICAvLyBSb2xsIGJhY2sgdGhlIHN0YXJ0IHBvaW50cy5cbiAgcGF0Y2guc3RhcnQxIC09IHByZWZpeC5sZW5ndGg7XG4gIHBhdGNoLnN0YXJ0MiAtPSBwcmVmaXgubGVuZ3RoO1xuICAvLyBFeHRlbmQgdGhlIGxlbmd0aHMuXG4gIHBhdGNoLmxlbmd0aDEgKz0gcHJlZml4Lmxlbmd0aCArIHN1ZmZpeC5sZW5ndGg7XG4gIHBhdGNoLmxlbmd0aDIgKz0gcHJlZml4Lmxlbmd0aCArIHN1ZmZpeC5sZW5ndGg7XG59O1xuXG5cbi8qKlxuICogQ29tcHV0ZSBhIGxpc3Qgb2YgcGF0Y2hlcyB0byB0dXJuIHRleHQxIGludG8gdGV4dDIuXG4gKiBVc2UgZGlmZnMgaWYgcHJvdmlkZWQsIG90aGVyd2lzZSBjb21wdXRlIGl0IG91cnNlbHZlcy5cbiAqIFRoZXJlIGFyZSBmb3VyIHdheXMgdG8gY2FsbCB0aGlzIGZ1bmN0aW9uLCBkZXBlbmRpbmcgb24gd2hhdCBkYXRhIGlzXG4gKiBhdmFpbGFibGUgdG8gdGhlIGNhbGxlcjpcbiAqIE1ldGhvZCAxOlxuICogYSA9IHRleHQxLCBiID0gdGV4dDJcbiAqIE1ldGhvZCAyOlxuICogYSA9IGRpZmZzXG4gKiBNZXRob2QgMyAob3B0aW1hbCk6XG4gKiBhID0gdGV4dDEsIGIgPSBkaWZmc1xuICogTWV0aG9kIDQgKGRlcHJlY2F0ZWQsIHVzZSBtZXRob2QgMyk6XG4gKiBhID0gdGV4dDEsIGIgPSB0ZXh0MiwgYyA9IGRpZmZzXG4gKlxuICogQHBhcmFtIHtzdHJpbmd8IUFycmF5LjwhZGlmZl9tYXRjaF9wYXRjaC5EaWZmPn0gYSB0ZXh0MSAobWV0aG9kcyAxLDMsNCkgb3JcbiAqIEFycmF5IG9mIGRpZmYgdHVwbGVzIGZvciB0ZXh0MSB0byB0ZXh0MiAobWV0aG9kIDIpLlxuICogQHBhcmFtIHtzdHJpbmd8IUFycmF5LjwhZGlmZl9tYXRjaF9wYXRjaC5EaWZmPn0gb3B0X2IgdGV4dDIgKG1ldGhvZHMgMSw0KSBvclxuICogQXJyYXkgb2YgZGlmZiB0dXBsZXMgZm9yIHRleHQxIHRvIHRleHQyIChtZXRob2QgMykgb3IgdW5kZWZpbmVkIChtZXRob2QgMikuXG4gKiBAcGFyYW0ge3N0cmluZ3whQXJyYXkuPCFkaWZmX21hdGNoX3BhdGNoLkRpZmY+fSBvcHRfYyBBcnJheSBvZiBkaWZmIHR1cGxlc1xuICogZm9yIHRleHQxIHRvIHRleHQyIChtZXRob2QgNCkgb3IgdW5kZWZpbmVkIChtZXRob2RzIDEsMiwzKS5cbiAqIEByZXR1cm4geyFBcnJheS48IWRpZmZfbWF0Y2hfcGF0Y2gucGF0Y2hfb2JqPn0gQXJyYXkgb2YgcGF0Y2ggb2JqZWN0cy5cbiAqL1xuZGlmZl9tYXRjaF9wYXRjaC5wcm90b3R5cGUucGF0Y2hfbWFrZSA9IGZ1bmN0aW9uKGEsIG9wdF9iLCBvcHRfYykge1xuICB2YXIgdGV4dDEsIGRpZmZzO1xuICBpZiAodHlwZW9mIGEgPT0gJ3N0cmluZycgJiYgdHlwZW9mIG9wdF9iID09ICdzdHJpbmcnICYmXG4gICAgICB0eXBlb2Ygb3B0X2MgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAvLyBNZXRob2QgMTogdGV4dDEsIHRleHQyXG4gICAgLy8gQ29tcHV0ZSBkaWZmcyBmcm9tIHRleHQxIGFuZCB0ZXh0Mi5cbiAgICB0ZXh0MSA9IC8qKiBAdHlwZSB7c3RyaW5nfSAqLyhhKTtcbiAgICBkaWZmcyA9IHRoaXMuZGlmZl9tYWluKHRleHQxLCAvKiogQHR5cGUge3N0cmluZ30gKi8ob3B0X2IpLCB0cnVlKTtcbiAgICBpZiAoZGlmZnMubGVuZ3RoID4gMikge1xuICAgICAgdGhpcy5kaWZmX2NsZWFudXBTZW1hbnRpYyhkaWZmcyk7XG4gICAgICB0aGlzLmRpZmZfY2xlYW51cEVmZmljaWVuY3koZGlmZnMpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChhICYmIHR5cGVvZiBhID09ICdvYmplY3QnICYmIHR5cGVvZiBvcHRfYiA9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgdHlwZW9mIG9wdF9jID09ICd1bmRlZmluZWQnKSB7XG4gICAgLy8gTWV0aG9kIDI6IGRpZmZzXG4gICAgLy8gQ29tcHV0ZSB0ZXh0MSBmcm9tIGRpZmZzLlxuICAgIGRpZmZzID0gLyoqIEB0eXBlIHshQXJyYXkuPCFkaWZmX21hdGNoX3BhdGNoLkRpZmY+fSAqLyhhKTtcbiAgICB0ZXh0MSA9IHRoaXMuZGlmZl90ZXh0MShkaWZmcyk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGEgPT0gJ3N0cmluZycgJiYgb3B0X2IgJiYgdHlwZW9mIG9wdF9iID09ICdvYmplY3QnICYmXG4gICAgICB0eXBlb2Ygb3B0X2MgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAvLyBNZXRob2QgMzogdGV4dDEsIGRpZmZzXG4gICAgdGV4dDEgPSAvKiogQHR5cGUge3N0cmluZ30gKi8oYSk7XG4gICAgZGlmZnMgPSAvKiogQHR5cGUgeyFBcnJheS48IWRpZmZfbWF0Y2hfcGF0Y2guRGlmZj59ICovKG9wdF9iKTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgYSA9PSAnc3RyaW5nJyAmJiB0eXBlb2Ygb3B0X2IgPT0gJ3N0cmluZycgJiZcbiAgICAgIG9wdF9jICYmIHR5cGVvZiBvcHRfYyA9PSAnb2JqZWN0Jykge1xuICAgIC8vIE1ldGhvZCA0OiB0ZXh0MSwgdGV4dDIsIGRpZmZzXG4gICAgLy8gdGV4dDIgaXMgbm90IHVzZWQuXG4gICAgdGV4dDEgPSAvKiogQHR5cGUge3N0cmluZ30gKi8oYSk7XG4gICAgZGlmZnMgPSAvKiogQHR5cGUgeyFBcnJheS48IWRpZmZfbWF0Y2hfcGF0Y2guRGlmZj59ICovKG9wdF9jKTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gY2FsbCBmb3JtYXQgdG8gcGF0Y2hfbWFrZS4nKTtcbiAgfVxuXG4gIGlmIChkaWZmcy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gW107ICAvLyBHZXQgcmlkIG9mIHRoZSBudWxsIGNhc2UuXG4gIH1cbiAgdmFyIHBhdGNoZXMgPSBbXTtcbiAgdmFyIHBhdGNoID0gbmV3IGRpZmZfbWF0Y2hfcGF0Y2gucGF0Y2hfb2JqKCk7XG4gIHZhciBwYXRjaERpZmZMZW5ndGggPSAwOyAgLy8gS2VlcGluZyBvdXIgb3duIGxlbmd0aCB2YXIgaXMgZmFzdGVyIGluIEpTLlxuICB2YXIgY2hhcl9jb3VudDEgPSAwOyAgLy8gTnVtYmVyIG9mIGNoYXJhY3RlcnMgaW50byB0aGUgdGV4dDEgc3RyaW5nLlxuICB2YXIgY2hhcl9jb3VudDIgPSAwOyAgLy8gTnVtYmVyIG9mIGNoYXJhY3RlcnMgaW50byB0aGUgdGV4dDIgc3RyaW5nLlxuICAvLyBTdGFydCB3aXRoIHRleHQxIChwcmVwYXRjaF90ZXh0KSBhbmQgYXBwbHkgdGhlIGRpZmZzIHVudGlsIHdlIGFycml2ZSBhdFxuICAvLyB0ZXh0MiAocG9zdHBhdGNoX3RleHQpLiAgV2UgcmVjcmVhdGUgdGhlIHBhdGNoZXMgb25lIGJ5IG9uZSB0byBkZXRlcm1pbmVcbiAgLy8gY29udGV4dCBpbmZvLlxuICB2YXIgcHJlcGF0Y2hfdGV4dCA9IHRleHQxO1xuICB2YXIgcG9zdHBhdGNoX3RleHQgPSB0ZXh0MTtcbiAgZm9yICh2YXIgeCA9IDA7IHggPCBkaWZmcy5sZW5ndGg7IHgrKykge1xuICAgIHZhciBkaWZmX3R5cGUgPSBkaWZmc1t4XVswXTtcbiAgICB2YXIgZGlmZl90ZXh0ID0gZGlmZnNbeF1bMV07XG5cbiAgICBpZiAoIXBhdGNoRGlmZkxlbmd0aCAmJiBkaWZmX3R5cGUgIT09IERJRkZfRVFVQUwpIHtcbiAgICAgIC8vIEEgbmV3IHBhdGNoIHN0YXJ0cyBoZXJlLlxuICAgICAgcGF0Y2guc3RhcnQxID0gY2hhcl9jb3VudDE7XG4gICAgICBwYXRjaC5zdGFydDIgPSBjaGFyX2NvdW50MjtcbiAgICB9XG5cbiAgICBzd2l0Y2ggKGRpZmZfdHlwZSkge1xuICAgICAgY2FzZSBESUZGX0lOU0VSVDpcbiAgICAgICAgcGF0Y2guZGlmZnNbcGF0Y2hEaWZmTGVuZ3RoKytdID0gZGlmZnNbeF07XG4gICAgICAgIHBhdGNoLmxlbmd0aDIgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcbiAgICAgICAgcG9zdHBhdGNoX3RleHQgPSBwb3N0cGF0Y2hfdGV4dC5zdWJzdHJpbmcoMCwgY2hhcl9jb3VudDIpICsgZGlmZl90ZXh0ICtcbiAgICAgICAgICAgICAgICAgICAgICAgICBwb3N0cGF0Y2hfdGV4dC5zdWJzdHJpbmcoY2hhcl9jb3VudDIpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgRElGRl9ERUxFVEU6XG4gICAgICAgIHBhdGNoLmxlbmd0aDEgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcbiAgICAgICAgcGF0Y2guZGlmZnNbcGF0Y2hEaWZmTGVuZ3RoKytdID0gZGlmZnNbeF07XG4gICAgICAgIHBvc3RwYXRjaF90ZXh0ID0gcG9zdHBhdGNoX3RleHQuc3Vic3RyaW5nKDAsIGNoYXJfY291bnQyKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgcG9zdHBhdGNoX3RleHQuc3Vic3RyaW5nKGNoYXJfY291bnQyICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlmZl90ZXh0Lmxlbmd0aCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBESUZGX0VRVUFMOlxuICAgICAgICBpZiAoZGlmZl90ZXh0Lmxlbmd0aCA8PSAyICogdGhpcy5QYXRjaF9NYXJnaW4gJiZcbiAgICAgICAgICAgIHBhdGNoRGlmZkxlbmd0aCAmJiBkaWZmcy5sZW5ndGggIT0geCArIDEpIHtcbiAgICAgICAgICAvLyBTbWFsbCBlcXVhbGl0eSBpbnNpZGUgYSBwYXRjaC5cbiAgICAgICAgICBwYXRjaC5kaWZmc1twYXRjaERpZmZMZW5ndGgrK10gPSBkaWZmc1t4XTtcbiAgICAgICAgICBwYXRjaC5sZW5ndGgxICs9IGRpZmZfdGV4dC5sZW5ndGg7XG4gICAgICAgICAgcGF0Y2gubGVuZ3RoMiArPSBkaWZmX3RleHQubGVuZ3RoO1xuICAgICAgICB9IGVsc2UgaWYgKGRpZmZfdGV4dC5sZW5ndGggPj0gMiAqIHRoaXMuUGF0Y2hfTWFyZ2luKSB7XG4gICAgICAgICAgLy8gVGltZSBmb3IgYSBuZXcgcGF0Y2guXG4gICAgICAgICAgaWYgKHBhdGNoRGlmZkxlbmd0aCkge1xuICAgICAgICAgICAgdGhpcy5wYXRjaF9hZGRDb250ZXh0XyhwYXRjaCwgcHJlcGF0Y2hfdGV4dCk7XG4gICAgICAgICAgICBwYXRjaGVzLnB1c2gocGF0Y2gpO1xuICAgICAgICAgICAgcGF0Y2ggPSBuZXcgZGlmZl9tYXRjaF9wYXRjaC5wYXRjaF9vYmooKTtcbiAgICAgICAgICAgIHBhdGNoRGlmZkxlbmd0aCA9IDA7XG4gICAgICAgICAgICAvLyBVbmxpa2UgVW5pZGlmZiwgb3VyIHBhdGNoIGxpc3RzIGhhdmUgYSByb2xsaW5nIGNvbnRleHQuXG4gICAgICAgICAgICAvLyBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvZ29vZ2xlLWRpZmYtbWF0Y2gtcGF0Y2gvd2lraS9VbmlkaWZmXG4gICAgICAgICAgICAvLyBVcGRhdGUgcHJlcGF0Y2ggdGV4dCAmIHBvcyB0byByZWZsZWN0IHRoZSBhcHBsaWNhdGlvbiBvZiB0aGVcbiAgICAgICAgICAgIC8vIGp1c3QgY29tcGxldGVkIHBhdGNoLlxuICAgICAgICAgICAgcHJlcGF0Y2hfdGV4dCA9IHBvc3RwYXRjaF90ZXh0O1xuICAgICAgICAgICAgY2hhcl9jb3VudDEgPSBjaGFyX2NvdW50MjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgLy8gVXBkYXRlIHRoZSBjdXJyZW50IGNoYXJhY3RlciBjb3VudC5cbiAgICBpZiAoZGlmZl90eXBlICE9PSBESUZGX0lOU0VSVCkge1xuICAgICAgY2hhcl9jb3VudDEgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcbiAgICB9XG4gICAgaWYgKGRpZmZfdHlwZSAhPT0gRElGRl9ERUxFVEUpIHtcbiAgICAgIGNoYXJfY291bnQyICs9IGRpZmZfdGV4dC5sZW5ndGg7XG4gICAgfVxuICB9XG4gIC8vIFBpY2sgdXAgdGhlIGxlZnRvdmVyIHBhdGNoIGlmIG5vdCBlbXB0eS5cbiAgaWYgKHBhdGNoRGlmZkxlbmd0aCkge1xuICAgIHRoaXMucGF0Y2hfYWRkQ29udGV4dF8ocGF0Y2gsIHByZXBhdGNoX3RleHQpO1xuICAgIHBhdGNoZXMucHVzaChwYXRjaCk7XG4gIH1cblxuICByZXR1cm4gcGF0Y2hlcztcbn07XG5cblxuLyoqXG4gKiBHaXZlbiBhbiBhcnJheSBvZiBwYXRjaGVzLCByZXR1cm4gYW5vdGhlciBhcnJheSB0aGF0IGlzIGlkZW50aWNhbC5cbiAqIEBwYXJhbSB7IUFycmF5LjwhZGlmZl9tYXRjaF9wYXRjaC5wYXRjaF9vYmo+fSBwYXRjaGVzIEFycmF5IG9mIHBhdGNoIG9iamVjdHMuXG4gKiBAcmV0dXJuIHshQXJyYXkuPCFkaWZmX21hdGNoX3BhdGNoLnBhdGNoX29iaj59IEFycmF5IG9mIHBhdGNoIG9iamVjdHMuXG4gKi9cbmRpZmZfbWF0Y2hfcGF0Y2gucHJvdG90eXBlLnBhdGNoX2RlZXBDb3B5ID0gZnVuY3Rpb24ocGF0Y2hlcykge1xuICAvLyBNYWtpbmcgZGVlcCBjb3BpZXMgaXMgaGFyZCBpbiBKYXZhU2NyaXB0LlxuICB2YXIgcGF0Y2hlc0NvcHkgPSBbXTtcbiAgZm9yICh2YXIgeCA9IDA7IHggPCBwYXRjaGVzLmxlbmd0aDsgeCsrKSB7XG4gICAgdmFyIHBhdGNoID0gcGF0Y2hlc1t4XTtcbiAgICB2YXIgcGF0Y2hDb3B5ID0gbmV3IGRpZmZfbWF0Y2hfcGF0Y2gucGF0Y2hfb2JqKCk7XG4gICAgcGF0Y2hDb3B5LmRpZmZzID0gW107XG4gICAgZm9yICh2YXIgeSA9IDA7IHkgPCBwYXRjaC5kaWZmcy5sZW5ndGg7IHkrKykge1xuICAgICAgcGF0Y2hDb3B5LmRpZmZzW3ldID0gcGF0Y2guZGlmZnNbeV0uc2xpY2UoKTtcbiAgICB9XG4gICAgcGF0Y2hDb3B5LnN0YXJ0MSA9IHBhdGNoLnN0YXJ0MTtcbiAgICBwYXRjaENvcHkuc3RhcnQyID0gcGF0Y2guc3RhcnQyO1xuICAgIHBhdGNoQ29weS5sZW5ndGgxID0gcGF0Y2gubGVuZ3RoMTtcbiAgICBwYXRjaENvcHkubGVuZ3RoMiA9IHBhdGNoLmxlbmd0aDI7XG4gICAgcGF0Y2hlc0NvcHlbeF0gPSBwYXRjaENvcHk7XG4gIH1cbiAgcmV0dXJuIHBhdGNoZXNDb3B5O1xufTtcblxuXG4vKipcbiAqIE1lcmdlIGEgc2V0IG9mIHBhdGNoZXMgb250byB0aGUgdGV4dC4gIFJldHVybiBhIHBhdGNoZWQgdGV4dCwgYXMgd2VsbFxuICogYXMgYSBsaXN0IG9mIHRydWUvZmFsc2UgdmFsdWVzIGluZGljYXRpbmcgd2hpY2ggcGF0Y2hlcyB3ZXJlIGFwcGxpZWQuXG4gKiBAcGFyYW0geyFBcnJheS48IWRpZmZfbWF0Y2hfcGF0Y2gucGF0Y2hfb2JqPn0gcGF0Y2hlcyBBcnJheSBvZiBwYXRjaCBvYmplY3RzLlxuICogQHBhcmFtIHtzdHJpbmd9IHRleHQgT2xkIHRleHQuXG4gKiBAcmV0dXJuIHshQXJyYXkuPHN0cmluZ3whQXJyYXkuPGJvb2xlYW4+Pn0gVHdvIGVsZW1lbnQgQXJyYXksIGNvbnRhaW5pbmcgdGhlXG4gKiAgICAgIG5ldyB0ZXh0IGFuZCBhbiBhcnJheSBvZiBib29sZWFuIHZhbHVlcy5cbiAqL1xuZGlmZl9tYXRjaF9wYXRjaC5wcm90b3R5cGUucGF0Y2hfYXBwbHkgPSBmdW5jdGlvbihwYXRjaGVzLCB0ZXh0KSB7XG4gIGlmIChwYXRjaGVzLmxlbmd0aCA9PSAwKSB7XG4gICAgcmV0dXJuIFt0ZXh0LCBbXV07XG4gIH1cblxuICAvLyBEZWVwIGNvcHkgdGhlIHBhdGNoZXMgc28gdGhhdCBubyBjaGFuZ2VzIGFyZSBtYWRlIHRvIG9yaWdpbmFscy5cbiAgcGF0Y2hlcyA9IHRoaXMucGF0Y2hfZGVlcENvcHkocGF0Y2hlcyk7XG5cbiAgdmFyIG51bGxQYWRkaW5nID0gdGhpcy5wYXRjaF9hZGRQYWRkaW5nKHBhdGNoZXMpO1xuICB0ZXh0ID0gbnVsbFBhZGRpbmcgKyB0ZXh0ICsgbnVsbFBhZGRpbmc7XG5cbiAgdGhpcy5wYXRjaF9zcGxpdE1heChwYXRjaGVzKTtcbiAgLy8gZGVsdGEga2VlcHMgdHJhY2sgb2YgdGhlIG9mZnNldCBiZXR3ZWVuIHRoZSBleHBlY3RlZCBhbmQgYWN0dWFsIGxvY2F0aW9uXG4gIC8vIG9mIHRoZSBwcmV2aW91cyBwYXRjaC4gIElmIHRoZXJlIGFyZSBwYXRjaGVzIGV4cGVjdGVkIGF0IHBvc2l0aW9ucyAxMCBhbmRcbiAgLy8gMjAsIGJ1dCB0aGUgZmlyc3QgcGF0Y2ggd2FzIGZvdW5kIGF0IDEyLCBkZWx0YSBpcyAyIGFuZCB0aGUgc2Vjb25kIHBhdGNoXG4gIC8vIGhhcyBhbiBlZmZlY3RpdmUgZXhwZWN0ZWQgcG9zaXRpb24gb2YgMjIuXG4gIHZhciBkZWx0YSA9IDA7XG4gIHZhciByZXN1bHRzID0gW107XG4gIGZvciAodmFyIHggPSAwOyB4IDwgcGF0Y2hlcy5sZW5ndGg7IHgrKykge1xuICAgIHZhciBleHBlY3RlZF9sb2MgPSBwYXRjaGVzW3hdLnN0YXJ0MiArIGRlbHRhO1xuICAgIHZhciB0ZXh0MSA9IHRoaXMuZGlmZl90ZXh0MShwYXRjaGVzW3hdLmRpZmZzKTtcbiAgICB2YXIgc3RhcnRfbG9jO1xuICAgIHZhciBlbmRfbG9jID0gLTE7XG4gICAgaWYgKHRleHQxLmxlbmd0aCA+IHRoaXMuTWF0Y2hfTWF4Qml0cykge1xuICAgICAgLy8gcGF0Y2hfc3BsaXRNYXggd2lsbCBvbmx5IHByb3ZpZGUgYW4gb3ZlcnNpemVkIHBhdHRlcm4gaW4gdGhlIGNhc2Ugb2ZcbiAgICAgIC8vIGEgbW9uc3RlciBkZWxldGUuXG4gICAgICBzdGFydF9sb2MgPSB0aGlzLm1hdGNoX21haW4odGV4dCwgdGV4dDEuc3Vic3RyaW5nKDAsIHRoaXMuTWF0Y2hfTWF4Qml0cyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWRfbG9jKTtcbiAgICAgIGlmIChzdGFydF9sb2MgIT0gLTEpIHtcbiAgICAgICAgZW5kX2xvYyA9IHRoaXMubWF0Y2hfbWFpbih0ZXh0LFxuICAgICAgICAgICAgdGV4dDEuc3Vic3RyaW5nKHRleHQxLmxlbmd0aCAtIHRoaXMuTWF0Y2hfTWF4Qml0cyksXG4gICAgICAgICAgICBleHBlY3RlZF9sb2MgKyB0ZXh0MS5sZW5ndGggLSB0aGlzLk1hdGNoX01heEJpdHMpO1xuICAgICAgICBpZiAoZW5kX2xvYyA9PSAtMSB8fCBzdGFydF9sb2MgPj0gZW5kX2xvYykge1xuICAgICAgICAgIC8vIENhbid0IGZpbmQgdmFsaWQgdHJhaWxpbmcgY29udGV4dC4gIERyb3AgdGhpcyBwYXRjaC5cbiAgICAgICAgICBzdGFydF9sb2MgPSAtMTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdGFydF9sb2MgPSB0aGlzLm1hdGNoX21haW4odGV4dCwgdGV4dDEsIGV4cGVjdGVkX2xvYyk7XG4gICAgfVxuICAgIGlmIChzdGFydF9sb2MgPT0gLTEpIHtcbiAgICAgIC8vIE5vIG1hdGNoIGZvdW5kLiAgOihcbiAgICAgIHJlc3VsdHNbeF0gPSBmYWxzZTtcbiAgICAgIC8vIFN1YnRyYWN0IHRoZSBkZWx0YSBmb3IgdGhpcyBmYWlsZWQgcGF0Y2ggZnJvbSBzdWJzZXF1ZW50IHBhdGNoZXMuXG4gICAgICBkZWx0YSAtPSBwYXRjaGVzW3hdLmxlbmd0aDIgLSBwYXRjaGVzW3hdLmxlbmd0aDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEZvdW5kIGEgbWF0Y2guICA6KVxuICAgICAgcmVzdWx0c1t4XSA9IHRydWU7XG4gICAgICBkZWx0YSA9IHN0YXJ0X2xvYyAtIGV4cGVjdGVkX2xvYztcbiAgICAgIHZhciB0ZXh0MjtcbiAgICAgIGlmIChlbmRfbG9jID09IC0xKSB7XG4gICAgICAgIHRleHQyID0gdGV4dC5zdWJzdHJpbmcoc3RhcnRfbG9jLCBzdGFydF9sb2MgKyB0ZXh0MS5sZW5ndGgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGV4dDIgPSB0ZXh0LnN1YnN0cmluZyhzdGFydF9sb2MsIGVuZF9sb2MgKyB0aGlzLk1hdGNoX01heEJpdHMpO1xuICAgICAgfVxuICAgICAgaWYgKHRleHQxID09IHRleHQyKSB7XG4gICAgICAgIC8vIFBlcmZlY3QgbWF0Y2gsIGp1c3Qgc2hvdmUgdGhlIHJlcGxhY2VtZW50IHRleHQgaW4uXG4gICAgICAgIHRleHQgPSB0ZXh0LnN1YnN0cmluZygwLCBzdGFydF9sb2MpICtcbiAgICAgICAgICAgICAgIHRoaXMuZGlmZl90ZXh0MihwYXRjaGVzW3hdLmRpZmZzKSArXG4gICAgICAgICAgICAgICB0ZXh0LnN1YnN0cmluZyhzdGFydF9sb2MgKyB0ZXh0MS5sZW5ndGgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSW1wZXJmZWN0IG1hdGNoLiAgUnVuIGEgZGlmZiB0byBnZXQgYSBmcmFtZXdvcmsgb2YgZXF1aXZhbGVudFxuICAgICAgICAvLyBpbmRpY2VzLlxuICAgICAgICB2YXIgZGlmZnMgPSB0aGlzLmRpZmZfbWFpbih0ZXh0MSwgdGV4dDIsIGZhbHNlKTtcbiAgICAgICAgaWYgKHRleHQxLmxlbmd0aCA+IHRoaXMuTWF0Y2hfTWF4Qml0cyAmJlxuICAgICAgICAgICAgdGhpcy5kaWZmX2xldmVuc2h0ZWluKGRpZmZzKSAvIHRleHQxLmxlbmd0aCA+XG4gICAgICAgICAgICB0aGlzLlBhdGNoX0RlbGV0ZVRocmVzaG9sZCkge1xuICAgICAgICAgIC8vIFRoZSBlbmQgcG9pbnRzIG1hdGNoLCBidXQgdGhlIGNvbnRlbnQgaXMgdW5hY2NlcHRhYmx5IGJhZC5cbiAgICAgICAgICByZXN1bHRzW3hdID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5kaWZmX2NsZWFudXBTZW1hbnRpY0xvc3NsZXNzKGRpZmZzKTtcbiAgICAgICAgICB2YXIgaW5kZXgxID0gMDtcbiAgICAgICAgICB2YXIgaW5kZXgyO1xuICAgICAgICAgIGZvciAodmFyIHkgPSAwOyB5IDwgcGF0Y2hlc1t4XS5kaWZmcy5sZW5ndGg7IHkrKykge1xuICAgICAgICAgICAgdmFyIG1vZCA9IHBhdGNoZXNbeF0uZGlmZnNbeV07XG4gICAgICAgICAgICBpZiAobW9kWzBdICE9PSBESUZGX0VRVUFMKSB7XG4gICAgICAgICAgICAgIGluZGV4MiA9IHRoaXMuZGlmZl94SW5kZXgoZGlmZnMsIGluZGV4MSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobW9kWzBdID09PSBESUZGX0lOU0VSVCkgeyAgLy8gSW5zZXJ0aW9uXG4gICAgICAgICAgICAgIHRleHQgPSB0ZXh0LnN1YnN0cmluZygwLCBzdGFydF9sb2MgKyBpbmRleDIpICsgbW9kWzFdICtcbiAgICAgICAgICAgICAgICAgICAgIHRleHQuc3Vic3RyaW5nKHN0YXJ0X2xvYyArIGluZGV4Mik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1vZFswXSA9PT0gRElGRl9ERUxFVEUpIHsgIC8vIERlbGV0aW9uXG4gICAgICAgICAgICAgIHRleHQgPSB0ZXh0LnN1YnN0cmluZygwLCBzdGFydF9sb2MgKyBpbmRleDIpICtcbiAgICAgICAgICAgICAgICAgICAgIHRleHQuc3Vic3RyaW5nKHN0YXJ0X2xvYyArIHRoaXMuZGlmZl94SW5kZXgoZGlmZnMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXgxICsgbW9kWzFdLmxlbmd0aCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG1vZFswXSAhPT0gRElGRl9ERUxFVEUpIHtcbiAgICAgICAgICAgICAgaW5kZXgxICs9IG1vZFsxXS5sZW5ndGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8vIFN0cmlwIHRoZSBwYWRkaW5nIG9mZi5cbiAgdGV4dCA9IHRleHQuc3Vic3RyaW5nKG51bGxQYWRkaW5nLmxlbmd0aCwgdGV4dC5sZW5ndGggLSBudWxsUGFkZGluZy5sZW5ndGgpO1xuICByZXR1cm4gW3RleHQsIHJlc3VsdHNdO1xufTtcblxuXG4vKipcbiAqIEFkZCBzb21lIHBhZGRpbmcgb24gdGV4dCBzdGFydCBhbmQgZW5kIHNvIHRoYXQgZWRnZXMgY2FuIG1hdGNoIHNvbWV0aGluZy5cbiAqIEludGVuZGVkIHRvIGJlIGNhbGxlZCBvbmx5IGZyb20gd2l0aGluIHBhdGNoX2FwcGx5LlxuICogQHBhcmFtIHshQXJyYXkuPCFkaWZmX21hdGNoX3BhdGNoLnBhdGNoX29iaj59IHBhdGNoZXMgQXJyYXkgb2YgcGF0Y2ggb2JqZWN0cy5cbiAqIEByZXR1cm4ge3N0cmluZ30gVGhlIHBhZGRpbmcgc3RyaW5nIGFkZGVkIHRvIGVhY2ggc2lkZS5cbiAqL1xuZGlmZl9tYXRjaF9wYXRjaC5wcm90b3R5cGUucGF0Y2hfYWRkUGFkZGluZyA9IGZ1bmN0aW9uKHBhdGNoZXMpIHtcbiAgdmFyIHBhZGRpbmdMZW5ndGggPSB0aGlzLlBhdGNoX01hcmdpbjtcbiAgdmFyIG51bGxQYWRkaW5nID0gJyc7XG4gIGZvciAodmFyIHggPSAxOyB4IDw9IHBhZGRpbmdMZW5ndGg7IHgrKykge1xuICAgIG51bGxQYWRkaW5nICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoeCk7XG4gIH1cblxuICAvLyBCdW1wIGFsbCB0aGUgcGF0Y2hlcyBmb3J3YXJkLlxuICBmb3IgKHZhciB4ID0gMDsgeCA8IHBhdGNoZXMubGVuZ3RoOyB4KyspIHtcbiAgICBwYXRjaGVzW3hdLnN0YXJ0MSArPSBwYWRkaW5nTGVuZ3RoO1xuICAgIHBhdGNoZXNbeF0uc3RhcnQyICs9IHBhZGRpbmdMZW5ndGg7XG4gIH1cblxuICAvLyBBZGQgc29tZSBwYWRkaW5nIG9uIHN0YXJ0IG9mIGZpcnN0IGRpZmYuXG4gIHZhciBwYXRjaCA9IHBhdGNoZXNbMF07XG4gIHZhciBkaWZmcyA9IHBhdGNoLmRpZmZzO1xuICBpZiAoZGlmZnMubGVuZ3RoID09IDAgfHwgZGlmZnNbMF1bMF0gIT0gRElGRl9FUVVBTCkge1xuICAgIC8vIEFkZCBudWxsUGFkZGluZyBlcXVhbGl0eS5cbiAgICBkaWZmcy51bnNoaWZ0KFtESUZGX0VRVUFMLCBudWxsUGFkZGluZ10pO1xuICAgIHBhdGNoLnN0YXJ0MSAtPSBwYWRkaW5nTGVuZ3RoOyAgLy8gU2hvdWxkIGJlIDAuXG4gICAgcGF0Y2guc3RhcnQyIC09IHBhZGRpbmdMZW5ndGg7ICAvLyBTaG91bGQgYmUgMC5cbiAgICBwYXRjaC5sZW5ndGgxICs9IHBhZGRpbmdMZW5ndGg7XG4gICAgcGF0Y2gubGVuZ3RoMiArPSBwYWRkaW5nTGVuZ3RoO1xuICB9IGVsc2UgaWYgKHBhZGRpbmdMZW5ndGggPiBkaWZmc1swXVsxXS5sZW5ndGgpIHtcbiAgICAvLyBHcm93IGZpcnN0IGVxdWFsaXR5LlxuICAgIHZhciBleHRyYUxlbmd0aCA9IHBhZGRpbmdMZW5ndGggLSBkaWZmc1swXVsxXS5sZW5ndGg7XG4gICAgZGlmZnNbMF1bMV0gPSBudWxsUGFkZGluZy5zdWJzdHJpbmcoZGlmZnNbMF1bMV0ubGVuZ3RoKSArIGRpZmZzWzBdWzFdO1xuICAgIHBhdGNoLnN0YXJ0MSAtPSBleHRyYUxlbmd0aDtcbiAgICBwYXRjaC5zdGFydDIgLT0gZXh0cmFMZW5ndGg7XG4gICAgcGF0Y2gubGVuZ3RoMSArPSBleHRyYUxlbmd0aDtcbiAgICBwYXRjaC5sZW5ndGgyICs9IGV4dHJhTGVuZ3RoO1xuICB9XG5cbiAgLy8gQWRkIHNvbWUgcGFkZGluZyBvbiBlbmQgb2YgbGFzdCBkaWZmLlxuICBwYXRjaCA9IHBhdGNoZXNbcGF0Y2hlcy5sZW5ndGggLSAxXTtcbiAgZGlmZnMgPSBwYXRjaC5kaWZmcztcbiAgaWYgKGRpZmZzLmxlbmd0aCA9PSAwIHx8IGRpZmZzW2RpZmZzLmxlbmd0aCAtIDFdWzBdICE9IERJRkZfRVFVQUwpIHtcbiAgICAvLyBBZGQgbnVsbFBhZGRpbmcgZXF1YWxpdHkuXG4gICAgZGlmZnMucHVzaChbRElGRl9FUVVBTCwgbnVsbFBhZGRpbmddKTtcbiAgICBwYXRjaC5sZW5ndGgxICs9IHBhZGRpbmdMZW5ndGg7XG4gICAgcGF0Y2gubGVuZ3RoMiArPSBwYWRkaW5nTGVuZ3RoO1xuICB9IGVsc2UgaWYgKHBhZGRpbmdMZW5ndGggPiBkaWZmc1tkaWZmcy5sZW5ndGggLSAxXVsxXS5sZW5ndGgpIHtcbiAgICAvLyBHcm93IGxhc3QgZXF1YWxpdHkuXG4gICAgdmFyIGV4dHJhTGVuZ3RoID0gcGFkZGluZ0xlbmd0aCAtIGRpZmZzW2RpZmZzLmxlbmd0aCAtIDFdWzFdLmxlbmd0aDtcbiAgICBkaWZmc1tkaWZmcy5sZW5ndGggLSAxXVsxXSArPSBudWxsUGFkZGluZy5zdWJzdHJpbmcoMCwgZXh0cmFMZW5ndGgpO1xuICAgIHBhdGNoLmxlbmd0aDEgKz0gZXh0cmFMZW5ndGg7XG4gICAgcGF0Y2gubGVuZ3RoMiArPSBleHRyYUxlbmd0aDtcbiAgfVxuXG4gIHJldHVybiBudWxsUGFkZGluZztcbn07XG5cblxuLyoqXG4gKiBMb29rIHRocm91Z2ggdGhlIHBhdGNoZXMgYW5kIGJyZWFrIHVwIGFueSB3aGljaCBhcmUgbG9uZ2VyIHRoYW4gdGhlIG1heGltdW1cbiAqIGxpbWl0IG9mIHRoZSBtYXRjaCBhbGdvcml0aG0uXG4gKiBJbnRlbmRlZCB0byBiZSBjYWxsZWQgb25seSBmcm9tIHdpdGhpbiBwYXRjaF9hcHBseS5cbiAqIEBwYXJhbSB7IUFycmF5LjwhZGlmZl9tYXRjaF9wYXRjaC5wYXRjaF9vYmo+fSBwYXRjaGVzIEFycmF5IG9mIHBhdGNoIG9iamVjdHMuXG4gKi9cbmRpZmZfbWF0Y2hfcGF0Y2gucHJvdG90eXBlLnBhdGNoX3NwbGl0TWF4ID0gZnVuY3Rpb24ocGF0Y2hlcykge1xuICB2YXIgcGF0Y2hfc2l6ZSA9IHRoaXMuTWF0Y2hfTWF4Qml0cztcbiAgZm9yICh2YXIgeCA9IDA7IHggPCBwYXRjaGVzLmxlbmd0aDsgeCsrKSB7XG4gICAgaWYgKHBhdGNoZXNbeF0ubGVuZ3RoMSA+IHBhdGNoX3NpemUpIHtcbiAgICAgIHZhciBiaWdwYXRjaCA9IHBhdGNoZXNbeF07XG4gICAgICAvLyBSZW1vdmUgdGhlIGJpZyBvbGQgcGF0Y2guXG4gICAgICBwYXRjaGVzLnNwbGljZSh4LS0sIDEpO1xuICAgICAgdmFyIHN0YXJ0MSA9IGJpZ3BhdGNoLnN0YXJ0MTtcbiAgICAgIHZhciBzdGFydDIgPSBiaWdwYXRjaC5zdGFydDI7XG4gICAgICB2YXIgcHJlY29udGV4dCA9ICcnO1xuICAgICAgd2hpbGUgKGJpZ3BhdGNoLmRpZmZzLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAvLyBDcmVhdGUgb25lIG9mIHNldmVyYWwgc21hbGxlciBwYXRjaGVzLlxuICAgICAgICB2YXIgcGF0Y2ggPSBuZXcgZGlmZl9tYXRjaF9wYXRjaC5wYXRjaF9vYmooKTtcbiAgICAgICAgdmFyIGVtcHR5ID0gdHJ1ZTtcbiAgICAgICAgcGF0Y2guc3RhcnQxID0gc3RhcnQxIC0gcHJlY29udGV4dC5sZW5ndGg7XG4gICAgICAgIHBhdGNoLnN0YXJ0MiA9IHN0YXJ0MiAtIHByZWNvbnRleHQubGVuZ3RoO1xuICAgICAgICBpZiAocHJlY29udGV4dCAhPT0gJycpIHtcbiAgICAgICAgICBwYXRjaC5sZW5ndGgxID0gcGF0Y2gubGVuZ3RoMiA9IHByZWNvbnRleHQubGVuZ3RoO1xuICAgICAgICAgIHBhdGNoLmRpZmZzLnB1c2goW0RJRkZfRVFVQUwsIHByZWNvbnRleHRdKTtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoYmlncGF0Y2guZGlmZnMubGVuZ3RoICE9PSAwICYmXG4gICAgICAgICAgICAgICBwYXRjaC5sZW5ndGgxIDwgcGF0Y2hfc2l6ZSAtIHRoaXMuUGF0Y2hfTWFyZ2luKSB7XG4gICAgICAgICAgdmFyIGRpZmZfdHlwZSA9IGJpZ3BhdGNoLmRpZmZzWzBdWzBdO1xuICAgICAgICAgIHZhciBkaWZmX3RleHQgPSBiaWdwYXRjaC5kaWZmc1swXVsxXTtcbiAgICAgICAgICBpZiAoZGlmZl90eXBlID09PSBESUZGX0lOU0VSVCkge1xuICAgICAgICAgICAgLy8gSW5zZXJ0aW9ucyBhcmUgaGFybWxlc3MuXG4gICAgICAgICAgICBwYXRjaC5sZW5ndGgyICs9IGRpZmZfdGV4dC5sZW5ndGg7XG4gICAgICAgICAgICBzdGFydDIgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcbiAgICAgICAgICAgIHBhdGNoLmRpZmZzLnB1c2goYmlncGF0Y2guZGlmZnMuc2hpZnQoKSk7XG4gICAgICAgICAgICBlbXB0eSA9IGZhbHNlO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZGlmZl90eXBlID09PSBESUZGX0RFTEVURSAmJiBwYXRjaC5kaWZmcy5sZW5ndGggPT0gMSAmJlxuICAgICAgICAgICAgICAgICAgICAgcGF0Y2guZGlmZnNbMF1bMF0gPT0gRElGRl9FUVVBTCAmJlxuICAgICAgICAgICAgICAgICAgICAgZGlmZl90ZXh0Lmxlbmd0aCA+IDIgKiBwYXRjaF9zaXplKSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzIGEgbGFyZ2UgZGVsZXRpb24uICBMZXQgaXQgcGFzcyBpbiBvbmUgY2h1bmsuXG4gICAgICAgICAgICBwYXRjaC5sZW5ndGgxICs9IGRpZmZfdGV4dC5sZW5ndGg7XG4gICAgICAgICAgICBzdGFydDEgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcbiAgICAgICAgICAgIGVtcHR5ID0gZmFsc2U7XG4gICAgICAgICAgICBwYXRjaC5kaWZmcy5wdXNoKFtkaWZmX3R5cGUsIGRpZmZfdGV4dF0pO1xuICAgICAgICAgICAgYmlncGF0Y2guZGlmZnMuc2hpZnQoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gRGVsZXRpb24gb3IgZXF1YWxpdHkuICBPbmx5IHRha2UgYXMgbXVjaCBhcyB3ZSBjYW4gc3RvbWFjaC5cbiAgICAgICAgICAgIGRpZmZfdGV4dCA9IGRpZmZfdGV4dC5zdWJzdHJpbmcoMCxcbiAgICAgICAgICAgICAgICBwYXRjaF9zaXplIC0gcGF0Y2gubGVuZ3RoMSAtIHRoaXMuUGF0Y2hfTWFyZ2luKTtcbiAgICAgICAgICAgIHBhdGNoLmxlbmd0aDEgKz0gZGlmZl90ZXh0Lmxlbmd0aDtcbiAgICAgICAgICAgIHN0YXJ0MSArPSBkaWZmX3RleHQubGVuZ3RoO1xuICAgICAgICAgICAgaWYgKGRpZmZfdHlwZSA9PT0gRElGRl9FUVVBTCkge1xuICAgICAgICAgICAgICBwYXRjaC5sZW5ndGgyICs9IGRpZmZfdGV4dC5sZW5ndGg7XG4gICAgICAgICAgICAgIHN0YXJ0MiArPSBkaWZmX3RleHQubGVuZ3RoO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZW1wdHkgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhdGNoLmRpZmZzLnB1c2goW2RpZmZfdHlwZSwgZGlmZl90ZXh0XSk7XG4gICAgICAgICAgICBpZiAoZGlmZl90ZXh0ID09IGJpZ3BhdGNoLmRpZmZzWzBdWzFdKSB7XG4gICAgICAgICAgICAgIGJpZ3BhdGNoLmRpZmZzLnNoaWZ0KCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBiaWdwYXRjaC5kaWZmc1swXVsxXSA9XG4gICAgICAgICAgICAgICAgICBiaWdwYXRjaC5kaWZmc1swXVsxXS5zdWJzdHJpbmcoZGlmZl90ZXh0Lmxlbmd0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIENvbXB1dGUgdGhlIGhlYWQgY29udGV4dCBmb3IgdGhlIG5leHQgcGF0Y2guXG4gICAgICAgIHByZWNvbnRleHQgPSB0aGlzLmRpZmZfdGV4dDIocGF0Y2guZGlmZnMpO1xuICAgICAgICBwcmVjb250ZXh0ID1cbiAgICAgICAgICAgIHByZWNvbnRleHQuc3Vic3RyaW5nKHByZWNvbnRleHQubGVuZ3RoIC0gdGhpcy5QYXRjaF9NYXJnaW4pO1xuICAgICAgICAvLyBBcHBlbmQgdGhlIGVuZCBjb250ZXh0IGZvciB0aGlzIHBhdGNoLlxuICAgICAgICB2YXIgcG9zdGNvbnRleHQgPSB0aGlzLmRpZmZfdGV4dDEoYmlncGF0Y2guZGlmZnMpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc3Vic3RyaW5nKDAsIHRoaXMuUGF0Y2hfTWFyZ2luKTtcbiAgICAgICAgaWYgKHBvc3Rjb250ZXh0ICE9PSAnJykge1xuICAgICAgICAgIHBhdGNoLmxlbmd0aDEgKz0gcG9zdGNvbnRleHQubGVuZ3RoO1xuICAgICAgICAgIHBhdGNoLmxlbmd0aDIgKz0gcG9zdGNvbnRleHQubGVuZ3RoO1xuICAgICAgICAgIGlmIChwYXRjaC5kaWZmcy5sZW5ndGggIT09IDAgJiZcbiAgICAgICAgICAgICAgcGF0Y2guZGlmZnNbcGF0Y2guZGlmZnMubGVuZ3RoIC0gMV1bMF0gPT09IERJRkZfRVFVQUwpIHtcbiAgICAgICAgICAgIHBhdGNoLmRpZmZzW3BhdGNoLmRpZmZzLmxlbmd0aCAtIDFdWzFdICs9IHBvc3Rjb250ZXh0O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwYXRjaC5kaWZmcy5wdXNoKFtESUZGX0VRVUFMLCBwb3N0Y29udGV4dF0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIWVtcHR5KSB7XG4gICAgICAgICAgcGF0Y2hlcy5zcGxpY2UoKyt4LCAwLCBwYXRjaCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cblxuLyoqXG4gKiBUYWtlIGEgbGlzdCBvZiBwYXRjaGVzIGFuZCByZXR1cm4gYSB0ZXh0dWFsIHJlcHJlc2VudGF0aW9uLlxuICogQHBhcmFtIHshQXJyYXkuPCFkaWZmX21hdGNoX3BhdGNoLnBhdGNoX29iaj59IHBhdGNoZXMgQXJyYXkgb2YgcGF0Y2ggb2JqZWN0cy5cbiAqIEByZXR1cm4ge3N0cmluZ30gVGV4dCByZXByZXNlbnRhdGlvbiBvZiBwYXRjaGVzLlxuICovXG5kaWZmX21hdGNoX3BhdGNoLnByb3RvdHlwZS5wYXRjaF90b1RleHQgPSBmdW5jdGlvbihwYXRjaGVzKSB7XG4gIHZhciB0ZXh0ID0gW107XG4gIGZvciAodmFyIHggPSAwOyB4IDwgcGF0Y2hlcy5sZW5ndGg7IHgrKykge1xuICAgIHRleHRbeF0gPSBwYXRjaGVzW3hdO1xuICB9XG4gIHJldHVybiB0ZXh0LmpvaW4oJycpO1xufTtcblxuXG4vKipcbiAqIFBhcnNlIGEgdGV4dHVhbCByZXByZXNlbnRhdGlvbiBvZiBwYXRjaGVzIGFuZCByZXR1cm4gYSBsaXN0IG9mIHBhdGNoIG9iamVjdHMuXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dGxpbmUgVGV4dCByZXByZXNlbnRhdGlvbiBvZiBwYXRjaGVzLlxuICogQHJldHVybiB7IUFycmF5LjwhZGlmZl9tYXRjaF9wYXRjaC5wYXRjaF9vYmo+fSBBcnJheSBvZiBwYXRjaCBvYmplY3RzLlxuICogQHRocm93cyB7IUVycm9yfSBJZiBpbnZhbGlkIGlucHV0LlxuICovXG5kaWZmX21hdGNoX3BhdGNoLnByb3RvdHlwZS5wYXRjaF9mcm9tVGV4dCA9IGZ1bmN0aW9uKHRleHRsaW5lKSB7XG4gIHZhciBwYXRjaGVzID0gW107XG4gIGlmICghdGV4dGxpbmUpIHtcbiAgICByZXR1cm4gcGF0Y2hlcztcbiAgfVxuICB2YXIgdGV4dCA9IHRleHRsaW5lLnNwbGl0KCdcXG4nKTtcbiAgdmFyIHRleHRQb2ludGVyID0gMDtcbiAgdmFyIHBhdGNoSGVhZGVyID0gL15AQCAtKFxcZCspLD8oXFxkKikgXFwrKFxcZCspLD8oXFxkKikgQEAkLztcbiAgd2hpbGUgKHRleHRQb2ludGVyIDwgdGV4dC5sZW5ndGgpIHtcbiAgICB2YXIgbSA9IHRleHRbdGV4dFBvaW50ZXJdLm1hdGNoKHBhdGNoSGVhZGVyKTtcbiAgICBpZiAoIW0pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBwYXRjaCBzdHJpbmc6ICcgKyB0ZXh0W3RleHRQb2ludGVyXSk7XG4gICAgfVxuICAgIHZhciBwYXRjaCA9IG5ldyBkaWZmX21hdGNoX3BhdGNoLnBhdGNoX29iaigpO1xuICAgIHBhdGNoZXMucHVzaChwYXRjaCk7XG4gICAgcGF0Y2guc3RhcnQxID0gcGFyc2VJbnQobVsxXSwgMTApO1xuICAgIGlmIChtWzJdID09PSAnJykge1xuICAgICAgcGF0Y2guc3RhcnQxLS07XG4gICAgICBwYXRjaC5sZW5ndGgxID0gMTtcbiAgICB9IGVsc2UgaWYgKG1bMl0gPT0gJzAnKSB7XG4gICAgICBwYXRjaC5sZW5ndGgxID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgcGF0Y2guc3RhcnQxLS07XG4gICAgICBwYXRjaC5sZW5ndGgxID0gcGFyc2VJbnQobVsyXSwgMTApO1xuICAgIH1cblxuICAgIHBhdGNoLnN0YXJ0MiA9IHBhcnNlSW50KG1bM10sIDEwKTtcbiAgICBpZiAobVs0XSA9PT0gJycpIHtcbiAgICAgIHBhdGNoLnN0YXJ0Mi0tO1xuICAgICAgcGF0Y2gubGVuZ3RoMiA9IDE7XG4gICAgfSBlbHNlIGlmIChtWzRdID09ICcwJykge1xuICAgICAgcGF0Y2gubGVuZ3RoMiA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhdGNoLnN0YXJ0Mi0tO1xuICAgICAgcGF0Y2gubGVuZ3RoMiA9IHBhcnNlSW50KG1bNF0sIDEwKTtcbiAgICB9XG4gICAgdGV4dFBvaW50ZXIrKztcblxuICAgIHdoaWxlICh0ZXh0UG9pbnRlciA8IHRleHQubGVuZ3RoKSB7XG4gICAgICB2YXIgc2lnbiA9IHRleHRbdGV4dFBvaW50ZXJdLmNoYXJBdCgwKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIHZhciBsaW5lID0gZGVjb2RlVVJJKHRleHRbdGV4dFBvaW50ZXJdLnN1YnN0cmluZygxKSk7XG4gICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAvLyBNYWxmb3JtZWQgVVJJIHNlcXVlbmNlLlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0lsbGVnYWwgZXNjYXBlIGluIHBhdGNoX2Zyb21UZXh0OiAnICsgbGluZSk7XG4gICAgICB9XG4gICAgICBpZiAoc2lnbiA9PSAnLScpIHtcbiAgICAgICAgLy8gRGVsZXRpb24uXG4gICAgICAgIHBhdGNoLmRpZmZzLnB1c2goW0RJRkZfREVMRVRFLCBsaW5lXSk7XG4gICAgICB9IGVsc2UgaWYgKHNpZ24gPT0gJysnKSB7XG4gICAgICAgIC8vIEluc2VydGlvbi5cbiAgICAgICAgcGF0Y2guZGlmZnMucHVzaChbRElGRl9JTlNFUlQsIGxpbmVdKTtcbiAgICAgIH0gZWxzZSBpZiAoc2lnbiA9PSAnICcpIHtcbiAgICAgICAgLy8gTWlub3IgZXF1YWxpdHkuXG4gICAgICAgIHBhdGNoLmRpZmZzLnB1c2goW0RJRkZfRVFVQUwsIGxpbmVdKTtcbiAgICAgIH0gZWxzZSBpZiAoc2lnbiA9PSAnQCcpIHtcbiAgICAgICAgLy8gU3RhcnQgb2YgbmV4dCBwYXRjaC5cbiAgICAgICAgYnJlYWs7XG4gICAgICB9IGVsc2UgaWYgKHNpZ24gPT09ICcnKSB7XG4gICAgICAgIC8vIEJsYW5rIGxpbmU/ICBXaGF0ZXZlci5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFdURj9cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHBhdGNoIG1vZGUgXCInICsgc2lnbiArICdcIiBpbjogJyArIGxpbmUpO1xuICAgICAgfVxuICAgICAgdGV4dFBvaW50ZXIrKztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHBhdGNoZXM7XG59O1xuXG5cbi8qKlxuICogQ2xhc3MgcmVwcmVzZW50aW5nIG9uZSBwYXRjaCBvcGVyYXRpb24uXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZGlmZl9tYXRjaF9wYXRjaC5wYXRjaF9vYmogPSBmdW5jdGlvbigpIHtcbiAgLyoqIEB0eXBlIHshQXJyYXkuPCFkaWZmX21hdGNoX3BhdGNoLkRpZmY+fSAqL1xuICB0aGlzLmRpZmZzID0gW107XG4gIC8qKiBAdHlwZSB7P251bWJlcn0gKi9cbiAgdGhpcy5zdGFydDEgPSBudWxsO1xuICAvKiogQHR5cGUgez9udW1iZXJ9ICovXG4gIHRoaXMuc3RhcnQyID0gbnVsbDtcbiAgLyoqIEB0eXBlIHtudW1iZXJ9ICovXG4gIHRoaXMubGVuZ3RoMSA9IDA7XG4gIC8qKiBAdHlwZSB7bnVtYmVyfSAqL1xuICB0aGlzLmxlbmd0aDIgPSAwO1xufTtcblxuXG4vKipcbiAqIEVtbXVsYXRlIEdOVSBkaWZmJ3MgZm9ybWF0LlxuICogSGVhZGVyOiBAQCAtMzgyLDggKzQ4MSw5IEBAXG4gKiBJbmRpY2llcyBhcmUgcHJpbnRlZCBhcyAxLWJhc2VkLCBub3QgMC1iYXNlZC5cbiAqIEByZXR1cm4ge3N0cmluZ30gVGhlIEdOVSBkaWZmIHN0cmluZy5cbiAqL1xuZGlmZl9tYXRjaF9wYXRjaC5wYXRjaF9vYmoucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gIHZhciBjb29yZHMxLCBjb29yZHMyO1xuICBpZiAodGhpcy5sZW5ndGgxID09PSAwKSB7XG4gICAgY29vcmRzMSA9IHRoaXMuc3RhcnQxICsgJywwJztcbiAgfSBlbHNlIGlmICh0aGlzLmxlbmd0aDEgPT0gMSkge1xuICAgIGNvb3JkczEgPSB0aGlzLnN0YXJ0MSArIDE7XG4gIH0gZWxzZSB7XG4gICAgY29vcmRzMSA9ICh0aGlzLnN0YXJ0MSArIDEpICsgJywnICsgdGhpcy5sZW5ndGgxO1xuICB9XG4gIGlmICh0aGlzLmxlbmd0aDIgPT09IDApIHtcbiAgICBjb29yZHMyID0gdGhpcy5zdGFydDIgKyAnLDAnO1xuICB9IGVsc2UgaWYgKHRoaXMubGVuZ3RoMiA9PSAxKSB7XG4gICAgY29vcmRzMiA9IHRoaXMuc3RhcnQyICsgMTtcbiAgfSBlbHNlIHtcbiAgICBjb29yZHMyID0gKHRoaXMuc3RhcnQyICsgMSkgKyAnLCcgKyB0aGlzLmxlbmd0aDI7XG4gIH1cbiAgdmFyIHRleHQgPSBbJ0BAIC0nICsgY29vcmRzMSArICcgKycgKyBjb29yZHMyICsgJyBAQFxcbiddO1xuICB2YXIgb3A7XG4gIC8vIEVzY2FwZSB0aGUgYm9keSBvZiB0aGUgcGF0Y2ggd2l0aCAleHggbm90YXRpb24uXG4gIGZvciAodmFyIHggPSAwOyB4IDwgdGhpcy5kaWZmcy5sZW5ndGg7IHgrKykge1xuICAgIHN3aXRjaCAodGhpcy5kaWZmc1t4XVswXSkge1xuICAgICAgY2FzZSBESUZGX0lOU0VSVDpcbiAgICAgICAgb3AgPSAnKyc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBESUZGX0RFTEVURTpcbiAgICAgICAgb3AgPSAnLSc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBESUZGX0VRVUFMOlxuICAgICAgICBvcCA9ICcgJztcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHRleHRbeCArIDFdID0gb3AgKyBlbmNvZGVVUkkodGhpcy5kaWZmc1t4XVsxXSkgKyAnXFxuJztcbiAgfVxuICByZXR1cm4gdGV4dC5qb2luKCcnKS5yZXBsYWNlKC8lMjAvZywgJyAnKTtcbn07XG5cblxuLy8gRXhwb3J0IHRoZXNlIGdsb2JhbCB2YXJpYWJsZXMgc28gdGhhdCB0aGV5IHN1cnZpdmUgR29vZ2xlJ3MgSlMgY29tcGlsZXIuXG4vLyBJbiBhIGJyb3dzZXIsICd0aGlzJyB3aWxsIGJlICd3aW5kb3cnLlxuLy8gSW4gbm9kZS5qcyAndGhpcycgd2lsbCBiZSBhIGdsb2JhbCBvYmplY3QuXG50aGlzWydkaWZmX21hdGNoX3BhdGNoJ10gPSBkaWZmX21hdGNoX3BhdGNoO1xudGhpc1snRElGRl9ERUxFVEUnXSA9IERJRkZfREVMRVRFO1xudGhpc1snRElGRl9JTlNFUlQnXSA9IERJRkZfSU5TRVJUO1xudGhpc1snRElGRl9FUVVBTCddID0gRElGRl9FUVVBTDtcblxuIiwiXG52YXIgUGlwZSA9IHJlcXVpcmUoJy4uL3BpcGUnKS5QaXBlO1xuXG52YXIgQ29udGV4dCA9IGZ1bmN0aW9uIENvbnRleHQoKXtcbn07XG5cbkNvbnRleHQucHJvdG90eXBlLnNldFJlc3VsdCA9IGZ1bmN0aW9uKHJlc3VsdCkge1xuXHR0aGlzLnJlc3VsdCA9IHJlc3VsdDtcblx0dGhpcy5oYXNSZXN1bHQgPSB0cnVlO1xuXHRyZXR1cm4gdGhpcztcbn07XG5cbkNvbnRleHQucHJvdG90eXBlLmV4aXQgPSBmdW5jdGlvbigpIHtcblx0dGhpcy5leGl0aW5nID0gdHJ1ZTtcblx0cmV0dXJuIHRoaXM7XG59O1xuXG5Db250ZXh0LnByb3RvdHlwZS5zd2l0Y2hUbyA9IGZ1bmN0aW9uKG5leHQsIHBpcGUpIHtcblx0aWYgKHR5cGVvZiBuZXh0ID09PSAnc3RyaW5nJyB8fCBuZXh0IGluc3RhbmNlb2YgUGlwZSkge1xuXHRcdHRoaXMubmV4dFBpcGUgPSBuZXh0O1xuXHR9IGVsc2Uge1xuXHRcdHRoaXMubmV4dCA9IG5leHQ7XG5cdFx0aWYgKHBpcGUpIHtcblx0XHRcdHRoaXMubmV4dFBpcGUgPSBwaXBlO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gdGhpcztcbn07XG5cbkNvbnRleHQucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbihjaGlsZCwgbmFtZSkge1xuXHRjaGlsZC5wYXJlbnQgPSB0aGlzO1xuXHRpZiAodHlwZW9mIG5hbWUgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0Y2hpbGQuY2hpbGROYW1lID0gbmFtZTtcblx0fVxuXHRjaGlsZC5yb290ID0gdGhpcy5yb290IHx8IHRoaXM7XG5cdGNoaWxkLm9wdGlvbnMgPSBjaGlsZC5vcHRpb25zIHx8IHRoaXMub3B0aW9ucztcblx0aWYgKCF0aGlzLmNoaWxkcmVuKSB7XG5cdFx0dGhpcy5jaGlsZHJlbiA9IFtjaGlsZF07XG5cdFx0dGhpcy5uZXh0QWZ0ZXJDaGlsZHJlbiA9IHRoaXMubmV4dCB8fCBudWxsO1xuXHRcdHRoaXMubmV4dCA9IGNoaWxkO1xuXHR9IGVsc2Uge1xuXHRcdHRoaXMuY2hpbGRyZW5bdGhpcy5jaGlsZHJlbi5sZW5ndGggLSAxXS5uZXh0ID0gY2hpbGQ7XG5cdFx0dGhpcy5jaGlsZHJlbi5wdXNoKGNoaWxkKTtcblx0fVxuXHRjaGlsZC5uZXh0ID0gdGhpcztcblx0cmV0dXJuIHRoaXM7XG59O1xuXG5leHBvcnRzLkNvbnRleHQgPSBDb250ZXh0O1xuIiwidmFyIENvbnRleHQgPSByZXF1aXJlKCcuL2NvbnRleHQnKS5Db250ZXh0O1xuXG52YXIgRGlmZkNvbnRleHQgPSBmdW5jdGlvbiBEaWZmQ29udGV4dChsZWZ0LCByaWdodCkge1xuICB0aGlzLmxlZnQgPSBsZWZ0O1xuICB0aGlzLnJpZ2h0ID0gcmlnaHQ7XG4gIHRoaXMucGlwZSA9ICdkaWZmJztcbn07XG5cbkRpZmZDb250ZXh0LnByb3RvdHlwZSA9IG5ldyBDb250ZXh0KCk7XG5cbmV4cG9ydHMuRGlmZkNvbnRleHQgPSBEaWZmQ29udGV4dDtcbiIsInZhciBDb250ZXh0ID0gcmVxdWlyZSgnLi9jb250ZXh0JykuQ29udGV4dDtcblxudmFyIFBhdGNoQ29udGV4dCA9IGZ1bmN0aW9uIFBhdGNoQ29udGV4dChsZWZ0LCBkZWx0YSkge1xuICB0aGlzLmxlZnQgPSBsZWZ0O1xuICB0aGlzLmRlbHRhID0gZGVsdGE7XG4gIHRoaXMucGlwZSA9ICdwYXRjaCc7XG59O1xuXG5QYXRjaENvbnRleHQucHJvdG90eXBlID0gbmV3IENvbnRleHQoKTtcblxuZXhwb3J0cy5QYXRjaENvbnRleHQgPSBQYXRjaENvbnRleHQ7XG4iLCJ2YXIgQ29udGV4dCA9IHJlcXVpcmUoJy4vY29udGV4dCcpLkNvbnRleHQ7XG5cbnZhciBSZXZlcnNlQ29udGV4dCA9IGZ1bmN0aW9uIFJldmVyc2VDb250ZXh0KGRlbHRhKSB7XG4gIHRoaXMuZGVsdGEgPSBkZWx0YTtcbiAgdGhpcy5waXBlID0gJ3JldmVyc2UnO1xufTtcblxuUmV2ZXJzZUNvbnRleHQucHJvdG90eXBlID0gbmV3IENvbnRleHQoKTtcblxuZXhwb3J0cy5SZXZlcnNlQ29udGV4dCA9IFJldmVyc2VDb250ZXh0O1xuIiwiLy8gdXNlIGFzIDJuZCBwYXJhbWV0ZXIgZm9yIEpTT04ucGFyc2UgdG8gcmV2aXZlIERhdGUgaW5zdGFuY2VzXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRhdGVSZXZpdmVyKGtleSwgdmFsdWUpIHtcbiAgdmFyIHBhcnRzO1xuICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgIHBhcnRzID0gL14oXFxkezR9KS0oXFxkezJ9KS0oXFxkezJ9KVQoXFxkezJ9KTooXFxkezJ9KTooXFxkezJ9KSg/OlxcLihcXGQqKSk/KFp8KFsrXFwtXSkoXFxkezJ9KTooXFxkezJ9KSkkLy5leGVjKHZhbHVlKTtcbiAgICBpZiAocGFydHMpIHtcbiAgICAgIHJldHVybiBuZXcgRGF0ZShEYXRlLlVUQygrcGFydHNbMV0sICtwYXJ0c1syXSAtIDEsICtwYXJ0c1szXSwgK3BhcnRzWzRdLCArcGFydHNbNV0sICtwYXJ0c1s2XSwgKyhwYXJ0c1s3XSB8fCAwKSkpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdmFsdWU7XG59O1xuIiwidmFyIFByb2Nlc3NvciA9IHJlcXVpcmUoJy4vcHJvY2Vzc29yJykuUHJvY2Vzc29yO1xudmFyIFBpcGUgPSByZXF1aXJlKCcuL3BpcGUnKS5QaXBlO1xudmFyIERpZmZDb250ZXh0ID0gcmVxdWlyZSgnLi9jb250ZXh0cy9kaWZmJykuRGlmZkNvbnRleHQ7XG52YXIgUGF0Y2hDb250ZXh0ID0gcmVxdWlyZSgnLi9jb250ZXh0cy9wYXRjaCcpLlBhdGNoQ29udGV4dDtcbnZhciBSZXZlcnNlQ29udGV4dCA9IHJlcXVpcmUoJy4vY29udGV4dHMvcmV2ZXJzZScpLlJldmVyc2VDb250ZXh0O1xuXG52YXIgdHJpdmlhbCA9IHJlcXVpcmUoJy4vZmlsdGVycy90cml2aWFsJyk7XG52YXIgbmVzdGVkID0gcmVxdWlyZSgnLi9maWx0ZXJzL25lc3RlZCcpO1xudmFyIGFycmF5cyA9IHJlcXVpcmUoJy4vZmlsdGVycy9hcnJheXMnKTtcbnZhciBkYXRlcyA9IHJlcXVpcmUoJy4vZmlsdGVycy9kYXRlcycpO1xudmFyIHRleHRzID0gcmVxdWlyZSgnLi9maWx0ZXJzL3RleHRzJyk7XG5cbnZhciBEaWZmUGF0Y2hlciA9IGZ1bmN0aW9uIERpZmZQYXRjaGVyKG9wdGlvbnMpIHtcbiAgdGhpcy5wcm9jZXNzb3IgPSBuZXcgUHJvY2Vzc29yKG9wdGlvbnMpO1xuICB0aGlzLnByb2Nlc3Nvci5waXBlKG5ldyBQaXBlKCdkaWZmJykuYXBwZW5kKFxuICAgIG5lc3RlZC5jb2xsZWN0Q2hpbGRyZW5EaWZmRmlsdGVyLFxuICAgIHRyaXZpYWwuZGlmZkZpbHRlcixcbiAgICBkYXRlcy5kaWZmRmlsdGVyLFxuICAgIHRleHRzLmRpZmZGaWx0ZXIsXG4gICAgbmVzdGVkLm9iamVjdHNEaWZmRmlsdGVyLFxuICAgIGFycmF5cy5kaWZmRmlsdGVyXG4gICkuc2hvdWxkSGF2ZVJlc3VsdCgpKTtcbiAgdGhpcy5wcm9jZXNzb3IucGlwZShuZXcgUGlwZSgncGF0Y2gnKS5hcHBlbmQoXG4gICAgbmVzdGVkLmNvbGxlY3RDaGlsZHJlblBhdGNoRmlsdGVyLFxuICAgIGFycmF5cy5jb2xsZWN0Q2hpbGRyZW5QYXRjaEZpbHRlcixcbiAgICB0cml2aWFsLnBhdGNoRmlsdGVyLFxuICAgIHRleHRzLnBhdGNoRmlsdGVyLFxuICAgIG5lc3RlZC5wYXRjaEZpbHRlcixcbiAgICBhcnJheXMucGF0Y2hGaWx0ZXJcbiAgKS5zaG91bGRIYXZlUmVzdWx0KCkpO1xuICB0aGlzLnByb2Nlc3Nvci5waXBlKG5ldyBQaXBlKCdyZXZlcnNlJykuYXBwZW5kKFxuICAgIG5lc3RlZC5jb2xsZWN0Q2hpbGRyZW5SZXZlcnNlRmlsdGVyLFxuICAgIGFycmF5cy5jb2xsZWN0Q2hpbGRyZW5SZXZlcnNlRmlsdGVyLFxuICAgIHRyaXZpYWwucmV2ZXJzZUZpbHRlcixcbiAgICB0ZXh0cy5yZXZlcnNlRmlsdGVyLFxuICAgIG5lc3RlZC5yZXZlcnNlRmlsdGVyLFxuICAgIGFycmF5cy5yZXZlcnNlRmlsdGVyXG4gICkuc2hvdWxkSGF2ZVJlc3VsdCgpKTtcbn07XG5cbkRpZmZQYXRjaGVyLnByb3RvdHlwZS5vcHRpb25zID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnByb2Nlc3Nvci5vcHRpb25zLmFwcGx5KHRoaXMucHJvY2Vzc29yLCBhcmd1bWVudHMpO1xufTtcblxuRGlmZlBhdGNoZXIucHJvdG90eXBlLmRpZmYgPSBmdW5jdGlvbihsZWZ0LCByaWdodCkge1xuICByZXR1cm4gdGhpcy5wcm9jZXNzb3IucHJvY2VzcyhuZXcgRGlmZkNvbnRleHQobGVmdCwgcmlnaHQpKTtcbn07XG5cbkRpZmZQYXRjaGVyLnByb3RvdHlwZS5wYXRjaCA9IGZ1bmN0aW9uKGxlZnQsIGRlbHRhKSB7XG4gIHJldHVybiB0aGlzLnByb2Nlc3Nvci5wcm9jZXNzKG5ldyBQYXRjaENvbnRleHQobGVmdCwgZGVsdGEpKTtcbn07XG5cbkRpZmZQYXRjaGVyLnByb3RvdHlwZS5yZXZlcnNlID0gZnVuY3Rpb24oZGVsdGEpIHtcbiAgcmV0dXJuIHRoaXMucHJvY2Vzc29yLnByb2Nlc3MobmV3IFJldmVyc2VDb250ZXh0KGRlbHRhKSk7XG59O1xuXG5EaWZmUGF0Y2hlci5wcm90b3R5cGUudW5wYXRjaCA9IGZ1bmN0aW9uKHJpZ2h0LCBkZWx0YSkge1xuICByZXR1cm4gdGhpcy5wYXRjaChyaWdodCwgdGhpcy5yZXZlcnNlKGRlbHRhKSk7XG59O1xuXG5leHBvcnRzLkRpZmZQYXRjaGVyID0gRGlmZlBhdGNoZXI7XG4iLCJcbmV4cG9ydHMuaXNCcm93c2VyID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCc7XG4iLCJ2YXIgRGlmZkNvbnRleHQgPSByZXF1aXJlKCcuLi9jb250ZXh0cy9kaWZmJykuRGlmZkNvbnRleHQ7XG52YXIgUGF0Y2hDb250ZXh0ID0gcmVxdWlyZSgnLi4vY29udGV4dHMvcGF0Y2gnKS5QYXRjaENvbnRleHQ7XG52YXIgUmV2ZXJzZUNvbnRleHQgPSByZXF1aXJlKCcuLi9jb250ZXh0cy9yZXZlcnNlJykuUmV2ZXJzZUNvbnRleHQ7XG5cbnZhciBsY3MgPSByZXF1aXJlKCcuL2xjcycpO1xuXG52YXIgQVJSQVlfTU9WRSA9IDM7XG5cbnZhciBpc0FycmF5ID0gKHR5cGVvZiBBcnJheS5pc0FycmF5ID09PSAnZnVuY3Rpb24nKSA/XG4gIC8vIHVzZSBuYXRpdmUgZnVuY3Rpb25cbiAgQXJyYXkuaXNBcnJheSA6XG4gIC8vIHVzZSBpbnN0YW5jZW9mIG9wZXJhdG9yXG4gIGZ1bmN0aW9uKGEpIHtcbiAgICByZXR1cm4gYSBpbnN0YW5jZW9mIEFycmF5O1xuICB9O1xuXG52YXIgYXJyYXlJbmRleE9mID0gdHlwZW9mIEFycmF5LnByb3RvdHlwZS5pbmRleE9mID09PSAnZnVuY3Rpb24nID9cbiAgZnVuY3Rpb24oYXJyYXksIGl0ZW0pIHtcbiAgICByZXR1cm4gYXJyYXkuaW5kZXhPZihpdGVtKTtcbiAgfSA6IGZ1bmN0aW9uKGFycmF5LCBpdGVtKSB7XG4gICAgdmFyIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYXJyYXlbaV0gPT09IGl0ZW0pIHtcbiAgICAgICAgcmV0dXJuIGk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAtMTtcbiAgfTtcblxuZnVuY3Rpb24gYXJyYXlzSGF2ZU1hdGNoQnlSZWYoYXJyYXkxLCBhcnJheTIsIGxlbjEsIGxlbjIpIHtcbiAgZm9yICh2YXIgaW5kZXgxID0gMDsgaW5kZXgxIDwgbGVuMTsgaW5kZXgxKyspIHtcbiAgICB2YXIgdmFsMSA9IGFycmF5MVtpbmRleDFdO1xuICAgIGZvciAodmFyIGluZGV4MiA9IDA7IGluZGV4MiA8IGxlbjI7IGluZGV4MisrKSB7XG4gICAgICB2YXIgdmFsMiA9IGFycmF5MltpbmRleDJdO1xuICAgICAgaWYgKHZhbDEgPT09IHZhbDIpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIG1hdGNoSXRlbXMoYXJyYXkxLCBhcnJheTIsIGluZGV4MSwgaW5kZXgyLCBjb250ZXh0KSB7XG4gIHZhciB2YWx1ZTEgPSBhcnJheTFbaW5kZXgxXTtcbiAgdmFyIHZhbHVlMiA9IGFycmF5MltpbmRleDJdO1xuICBpZiAodmFsdWUxID09PSB2YWx1ZTIpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBpZiAodHlwZW9mIHZhbHVlMSAhPT0gJ29iamVjdCcgfHwgdHlwZW9mIHZhbHVlMiAhPT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgdmFyIG9iamVjdEhhc2ggPSBjb250ZXh0Lm9iamVjdEhhc2g7XG4gIGlmICghb2JqZWN0SGFzaCkge1xuICAgIC8vIG5vIHdheSB0byBtYXRjaCBvYmplY3RzIHdhcyBwcm92aWRlZCwgdHJ5IG1hdGNoIGJ5IHBvc2l0aW9uXG4gICAgcmV0dXJuIGNvbnRleHQubWF0Y2hCeVBvc2l0aW9uICYmIGluZGV4MSA9PT0gaW5kZXgyO1xuICB9XG4gIHZhciBoYXNoMTtcbiAgdmFyIGhhc2gyO1xuICBpZiAodHlwZW9mIGluZGV4MSA9PT0gJ251bWJlcicpIHtcbiAgICBjb250ZXh0Lmhhc2hDYWNoZTEgPSBjb250ZXh0Lmhhc2hDYWNoZTEgfHwgW107XG4gICAgaGFzaDEgPSBjb250ZXh0Lmhhc2hDYWNoZTFbaW5kZXgxXTtcbiAgICBpZiAodHlwZW9mIGhhc2gxID09PSAndW5kZWZpbmVkJykge1xuICAgICAgY29udGV4dC5oYXNoQ2FjaGUxW2luZGV4MV0gPSBoYXNoMSA9IG9iamVjdEhhc2godmFsdWUxLCBpbmRleDEpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBoYXNoMSA9IG9iamVjdEhhc2godmFsdWUxKTtcbiAgfVxuICBpZiAodHlwZW9mIGhhc2gxID09PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAodHlwZW9mIGluZGV4MiA9PT0gJ251bWJlcicpIHtcbiAgICBjb250ZXh0Lmhhc2hDYWNoZTIgPSBjb250ZXh0Lmhhc2hDYWNoZTIgfHwgW107XG4gICAgaGFzaDIgPSBjb250ZXh0Lmhhc2hDYWNoZTJbaW5kZXgyXTtcbiAgICBpZiAodHlwZW9mIGhhc2gyID09PSAndW5kZWZpbmVkJykge1xuICAgICAgY29udGV4dC5oYXNoQ2FjaGUyW2luZGV4Ml0gPSBoYXNoMiA9IG9iamVjdEhhc2godmFsdWUyLCBpbmRleDIpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBoYXNoMiA9IG9iamVjdEhhc2godmFsdWUyKTtcbiAgfVxuICBpZiAodHlwZW9mIGhhc2gyID09PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gaGFzaDEgPT09IGhhc2gyO1xufVxuXG52YXIgZGlmZkZpbHRlciA9IGZ1bmN0aW9uIGFycmF5c0RpZmZGaWx0ZXIoY29udGV4dCkge1xuICBpZiAoIWNvbnRleHQubGVmdElzQXJyYXkpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgbWF0Y2hDb250ZXh0ID0ge1xuICAgIG9iamVjdEhhc2g6IGNvbnRleHQub3B0aW9ucyAmJiBjb250ZXh0Lm9wdGlvbnMub2JqZWN0SGFzaCxcbiAgICBtYXRjaEJ5UG9zaXRpb246IGNvbnRleHQub3B0aW9ucyAmJiBjb250ZXh0Lm9wdGlvbnMubWF0Y2hCeVBvc2l0aW9uXG4gIH07XG4gIHZhciBjb21tb25IZWFkID0gMDtcbiAgdmFyIGNvbW1vblRhaWwgPSAwO1xuICB2YXIgaW5kZXg7XG4gIHZhciBpbmRleDE7XG4gIHZhciBpbmRleDI7XG4gIHZhciBhcnJheTEgPSBjb250ZXh0LmxlZnQ7XG4gIHZhciBhcnJheTIgPSBjb250ZXh0LnJpZ2h0O1xuICB2YXIgbGVuMSA9IGFycmF5MS5sZW5ndGg7XG4gIHZhciBsZW4yID0gYXJyYXkyLmxlbmd0aDtcblxuICB2YXIgY2hpbGQ7XG5cbiAgaWYgKGxlbjEgPiAwICYmIGxlbjIgPiAwICYmICFtYXRjaENvbnRleHQub2JqZWN0SGFzaCAmJlxuICAgIHR5cGVvZiBtYXRjaENvbnRleHQubWF0Y2hCeVBvc2l0aW9uICE9PSAnYm9vbGVhbicpIHtcbiAgICBtYXRjaENvbnRleHQubWF0Y2hCeVBvc2l0aW9uID0gIWFycmF5c0hhdmVNYXRjaEJ5UmVmKGFycmF5MSwgYXJyYXkyLCBsZW4xLCBsZW4yKTtcbiAgfVxuXG4gIC8vIHNlcGFyYXRlIGNvbW1vbiBoZWFkXG4gIHdoaWxlIChjb21tb25IZWFkIDwgbGVuMSAmJiBjb21tb25IZWFkIDwgbGVuMiAmJlxuICAgIG1hdGNoSXRlbXMoYXJyYXkxLCBhcnJheTIsIGNvbW1vbkhlYWQsIGNvbW1vbkhlYWQsIG1hdGNoQ29udGV4dCkpIHtcbiAgICBpbmRleCA9IGNvbW1vbkhlYWQ7XG4gICAgY2hpbGQgPSBuZXcgRGlmZkNvbnRleHQoY29udGV4dC5sZWZ0W2luZGV4XSwgY29udGV4dC5yaWdodFtpbmRleF0pO1xuICAgIGNvbnRleHQucHVzaChjaGlsZCwgaW5kZXgpO1xuICAgIGNvbW1vbkhlYWQrKztcbiAgfVxuICAvLyBzZXBhcmF0ZSBjb21tb24gdGFpbFxuICB3aGlsZSAoY29tbW9uVGFpbCArIGNvbW1vbkhlYWQgPCBsZW4xICYmIGNvbW1vblRhaWwgKyBjb21tb25IZWFkIDwgbGVuMiAmJlxuICAgIG1hdGNoSXRlbXMoYXJyYXkxLCBhcnJheTIsIGxlbjEgLSAxIC0gY29tbW9uVGFpbCwgbGVuMiAtIDEgLSBjb21tb25UYWlsLCBtYXRjaENvbnRleHQpKSB7XG4gICAgaW5kZXgxID0gbGVuMSAtIDEgLSBjb21tb25UYWlsO1xuICAgIGluZGV4MiA9IGxlbjIgLSAxIC0gY29tbW9uVGFpbDtcbiAgICBjaGlsZCA9IG5ldyBEaWZmQ29udGV4dChjb250ZXh0LmxlZnRbaW5kZXgxXSwgY29udGV4dC5yaWdodFtpbmRleDJdKTtcbiAgICBjb250ZXh0LnB1c2goY2hpbGQsIGluZGV4Mik7XG4gICAgY29tbW9uVGFpbCsrO1xuICB9XG4gIHZhciByZXN1bHQ7XG4gIGlmIChjb21tb25IZWFkICsgY29tbW9uVGFpbCA9PT0gbGVuMSkge1xuICAgIGlmIChsZW4xID09PSBsZW4yKSB7XG4gICAgICAvLyBhcnJheXMgYXJlIGlkZW50aWNhbFxuICAgICAgY29udGV4dC5zZXRSZXN1bHQodW5kZWZpbmVkKS5leGl0KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIHRyaXZpYWwgY2FzZSwgYSBibG9jayAoMSBvciBtb3JlIGNvbnNlY3V0aXZlIGl0ZW1zKSB3YXMgYWRkZWRcbiAgICByZXN1bHQgPSByZXN1bHQgfHwge1xuICAgICAgX3Q6ICdhJ1xuICAgIH07XG4gICAgZm9yIChpbmRleCA9IGNvbW1vbkhlYWQ7IGluZGV4IDwgbGVuMiAtIGNvbW1vblRhaWw7IGluZGV4KyspIHtcbiAgICAgIHJlc3VsdFtpbmRleF0gPSBbYXJyYXkyW2luZGV4XV07XG4gICAgfVxuICAgIGNvbnRleHQuc2V0UmVzdWx0KHJlc3VsdCkuZXhpdCgpO1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoY29tbW9uSGVhZCArIGNvbW1vblRhaWwgPT09IGxlbjIpIHtcbiAgICAvLyB0cml2aWFsIGNhc2UsIGEgYmxvY2sgKDEgb3IgbW9yZSBjb25zZWN1dGl2ZSBpdGVtcykgd2FzIHJlbW92ZWRcbiAgICByZXN1bHQgPSByZXN1bHQgfHwge1xuICAgICAgX3Q6ICdhJ1xuICAgIH07XG4gICAgZm9yIChpbmRleCA9IGNvbW1vbkhlYWQ7IGluZGV4IDwgbGVuMSAtIGNvbW1vblRhaWw7IGluZGV4KyspIHtcbiAgICAgIHJlc3VsdFsnXycgKyBpbmRleF0gPSBbYXJyYXkxW2luZGV4XSwgMCwgMF07XG4gICAgfVxuICAgIGNvbnRleHQuc2V0UmVzdWx0KHJlc3VsdCkuZXhpdCgpO1xuICAgIHJldHVybjtcbiAgfVxuICAvLyByZXNldCBoYXNoIGNhY2hlXG4gIGRlbGV0ZSBtYXRjaENvbnRleHQuaGFzaENhY2hlMTtcbiAgZGVsZXRlIG1hdGNoQ29udGV4dC5oYXNoQ2FjaGUyO1xuXG4gIC8vIGRpZmYgaXMgbm90IHRyaXZpYWwsIGZpbmQgdGhlIExDUyAoTG9uZ2VzdCBDb21tb24gU3Vic2VxdWVuY2UpXG4gIHZhciB0cmltbWVkMSA9IGFycmF5MS5zbGljZShjb21tb25IZWFkLCBsZW4xIC0gY29tbW9uVGFpbCk7XG4gIHZhciB0cmltbWVkMiA9IGFycmF5Mi5zbGljZShjb21tb25IZWFkLCBsZW4yIC0gY29tbW9uVGFpbCk7XG4gIHZhciBzZXEgPSBsY3MuZ2V0KFxuICAgIHRyaW1tZWQxLCB0cmltbWVkMixcbiAgICBtYXRjaEl0ZW1zLFxuICAgIG1hdGNoQ29udGV4dFxuICApO1xuICB2YXIgcmVtb3ZlZEl0ZW1zID0gW107XG4gIHJlc3VsdCA9IHJlc3VsdCB8fCB7XG4gICAgX3Q6ICdhJ1xuICB9O1xuICBmb3IgKGluZGV4ID0gY29tbW9uSGVhZDsgaW5kZXggPCBsZW4xIC0gY29tbW9uVGFpbDsgaW5kZXgrKykge1xuICAgIGlmIChhcnJheUluZGV4T2Yoc2VxLmluZGljZXMxLCBpbmRleCAtIGNvbW1vbkhlYWQpIDwgMCkge1xuICAgICAgLy8gcmVtb3ZlZFxuICAgICAgcmVzdWx0WydfJyArIGluZGV4XSA9IFthcnJheTFbaW5kZXhdLCAwLCAwXTtcbiAgICAgIHJlbW92ZWRJdGVtcy5wdXNoKGluZGV4KTtcbiAgICB9XG4gIH1cblxuICB2YXIgZGV0ZWN0TW92ZSA9IHRydWU7XG4gIGlmIChjb250ZXh0Lm9wdGlvbnMgJiYgY29udGV4dC5vcHRpb25zLmFycmF5cyAmJiBjb250ZXh0Lm9wdGlvbnMuYXJyYXlzLmRldGVjdE1vdmUgPT09IGZhbHNlKSB7XG4gICAgZGV0ZWN0TW92ZSA9IGZhbHNlO1xuICB9XG4gIHZhciBpbmNsdWRlVmFsdWVPbk1vdmUgPSBmYWxzZTtcbiAgaWYgKGNvbnRleHQub3B0aW9ucyAmJiBjb250ZXh0Lm9wdGlvbnMuYXJyYXlzICYmIGNvbnRleHQub3B0aW9ucy5hcnJheXMuaW5jbHVkZVZhbHVlT25Nb3ZlKSB7XG4gICAgaW5jbHVkZVZhbHVlT25Nb3ZlID0gdHJ1ZTtcbiAgfVxuXG4gIHZhciByZW1vdmVkSXRlbXNMZW5ndGggPSByZW1vdmVkSXRlbXMubGVuZ3RoO1xuICBmb3IgKGluZGV4ID0gY29tbW9uSGVhZDsgaW5kZXggPCBsZW4yIC0gY29tbW9uVGFpbDsgaW5kZXgrKykge1xuICAgIHZhciBpbmRleE9uQXJyYXkyID0gYXJyYXlJbmRleE9mKHNlcS5pbmRpY2VzMiwgaW5kZXggLSBjb21tb25IZWFkKTtcbiAgICBpZiAoaW5kZXhPbkFycmF5MiA8IDApIHtcbiAgICAgIC8vIGFkZGVkLCB0cnkgdG8gbWF0Y2ggd2l0aCBhIHJlbW92ZWQgaXRlbSBhbmQgcmVnaXN0ZXIgYXMgcG9zaXRpb24gbW92ZVxuICAgICAgdmFyIGlzTW92ZSA9IGZhbHNlO1xuICAgICAgaWYgKGRldGVjdE1vdmUgJiYgcmVtb3ZlZEl0ZW1zTGVuZ3RoID4gMCkge1xuICAgICAgICBmb3IgKHZhciByZW1vdmVJdGVtSW5kZXgxID0gMDsgcmVtb3ZlSXRlbUluZGV4MSA8IHJlbW92ZWRJdGVtc0xlbmd0aDsgcmVtb3ZlSXRlbUluZGV4MSsrKSB7XG4gICAgICAgICAgaW5kZXgxID0gcmVtb3ZlZEl0ZW1zW3JlbW92ZUl0ZW1JbmRleDFdO1xuICAgICAgICAgIGlmIChtYXRjaEl0ZW1zKHRyaW1tZWQxLCB0cmltbWVkMiwgaW5kZXgxIC0gY29tbW9uSGVhZCxcbiAgICAgICAgICAgIGluZGV4IC0gY29tbW9uSGVhZCwgbWF0Y2hDb250ZXh0KSkge1xuICAgICAgICAgICAgLy8gc3RvcmUgcG9zaXRpb24gbW92ZSBhczogW29yaWdpbmFsVmFsdWUsIG5ld1Bvc2l0aW9uLCBBUlJBWV9NT1ZFXVxuICAgICAgICAgICAgcmVzdWx0WydfJyArIGluZGV4MV0uc3BsaWNlKDEsIDIsIGluZGV4LCBBUlJBWV9NT1ZFKTtcbiAgICAgICAgICAgIGlmICghaW5jbHVkZVZhbHVlT25Nb3ZlKSB7XG4gICAgICAgICAgICAgIC8vIGRvbid0IGluY2x1ZGUgbW92ZWQgdmFsdWUgb24gZGlmZiwgdG8gc2F2ZSBieXRlc1xuICAgICAgICAgICAgICByZXN1bHRbJ18nICsgaW5kZXgxXVswXSA9ICcnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpbmRleDIgPSBpbmRleDtcbiAgICAgICAgICAgIGNoaWxkID0gbmV3IERpZmZDb250ZXh0KGNvbnRleHQubGVmdFtpbmRleDFdLCBjb250ZXh0LnJpZ2h0W2luZGV4Ml0pO1xuICAgICAgICAgICAgY29udGV4dC5wdXNoKGNoaWxkLCBpbmRleDIpO1xuICAgICAgICAgICAgcmVtb3ZlZEl0ZW1zLnNwbGljZShyZW1vdmVJdGVtSW5kZXgxLCAxKTtcbiAgICAgICAgICAgIGlzTW92ZSA9IHRydWU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICghaXNNb3ZlKSB7XG4gICAgICAgIC8vIGFkZGVkXG4gICAgICAgIHJlc3VsdFtpbmRleF0gPSBbYXJyYXkyW2luZGV4XV07XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIG1hdGNoLCBkbyBpbm5lciBkaWZmXG4gICAgICBpbmRleDEgPSBzZXEuaW5kaWNlczFbaW5kZXhPbkFycmF5Ml0gKyBjb21tb25IZWFkO1xuICAgICAgaW5kZXgyID0gc2VxLmluZGljZXMyW2luZGV4T25BcnJheTJdICsgY29tbW9uSGVhZDtcbiAgICAgIGNoaWxkID0gbmV3IERpZmZDb250ZXh0KGNvbnRleHQubGVmdFtpbmRleDFdLCBjb250ZXh0LnJpZ2h0W2luZGV4Ml0pO1xuICAgICAgY29udGV4dC5wdXNoKGNoaWxkLCBpbmRleDIpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnRleHQuc2V0UmVzdWx0KHJlc3VsdCkuZXhpdCgpO1xuXG59O1xuZGlmZkZpbHRlci5maWx0ZXJOYW1lID0gJ2FycmF5cyc7XG5cbnZhciBjb21wYXJlID0ge1xuICBudW1lcmljYWxseTogZnVuY3Rpb24oYSwgYikge1xuICAgIHJldHVybiBhIC0gYjtcbiAgfSxcbiAgbnVtZXJpY2FsbHlCeTogZnVuY3Rpb24obmFtZSkge1xuICAgIHJldHVybiBmdW5jdGlvbihhLCBiKSB7XG4gICAgICByZXR1cm4gYVtuYW1lXSAtIGJbbmFtZV07XG4gICAgfTtcbiAgfVxufTtcblxudmFyIHBhdGNoRmlsdGVyID0gZnVuY3Rpb24gbmVzdGVkUGF0Y2hGaWx0ZXIoY29udGV4dCkge1xuICBpZiAoIWNvbnRleHQubmVzdGVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChjb250ZXh0LmRlbHRhLl90ICE9PSAnYScpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIGluZGV4LCBpbmRleDE7XG5cbiAgdmFyIGRlbHRhID0gY29udGV4dC5kZWx0YTtcbiAgdmFyIGFycmF5ID0gY29udGV4dC5sZWZ0O1xuXG4gIC8vIGZpcnN0LCBzZXBhcmF0ZSByZW1vdmFscywgaW5zZXJ0aW9ucyBhbmQgbW9kaWZpY2F0aW9uc1xuICB2YXIgdG9SZW1vdmUgPSBbXTtcbiAgdmFyIHRvSW5zZXJ0ID0gW107XG4gIHZhciB0b01vZGlmeSA9IFtdO1xuICBmb3IgKGluZGV4IGluIGRlbHRhKSB7XG4gICAgaWYgKGluZGV4ICE9PSAnX3QnKSB7XG4gICAgICBpZiAoaW5kZXhbMF0gPT09ICdfJykge1xuICAgICAgICAvLyByZW1vdmVkIGl0ZW0gZnJvbSBvcmlnaW5hbCBhcnJheVxuICAgICAgICBpZiAoZGVsdGFbaW5kZXhdWzJdID09PSAwIHx8IGRlbHRhW2luZGV4XVsyXSA9PT0gQVJSQVlfTU9WRSkge1xuICAgICAgICAgIHRvUmVtb3ZlLnB1c2gocGFyc2VJbnQoaW5kZXguc2xpY2UoMSksIDEwKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdvbmx5IHJlbW92YWwgb3IgbW92ZSBjYW4gYmUgYXBwbGllZCBhdCBvcmlnaW5hbCBhcnJheSBpbmRpY2VzJyArXG4gICAgICAgICAgICAnLCBpbnZhbGlkIGRpZmYgdHlwZTogJyArIGRlbHRhW2luZGV4XVsyXSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChkZWx0YVtpbmRleF0ubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgLy8gYWRkZWQgaXRlbSBhdCBuZXcgYXJyYXlcbiAgICAgICAgICB0b0luc2VydC5wdXNoKHtcbiAgICAgICAgICAgIGluZGV4OiBwYXJzZUludChpbmRleCwgMTApLFxuICAgICAgICAgICAgdmFsdWU6IGRlbHRhW2luZGV4XVswXVxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIG1vZGlmaWVkIGl0ZW0gYXQgbmV3IGFycmF5XG4gICAgICAgICAgdG9Nb2RpZnkucHVzaCh7XG4gICAgICAgICAgICBpbmRleDogcGFyc2VJbnQoaW5kZXgsIDEwKSxcbiAgICAgICAgICAgIGRlbHRhOiBkZWx0YVtpbmRleF1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIHJlbW92ZSBpdGVtcywgaW4gcmV2ZXJzZSBvcmRlciB0byBhdm9pZCBzYXdpbmcgb3VyIG93biBmbG9vclxuICB0b1JlbW92ZSA9IHRvUmVtb3ZlLnNvcnQoY29tcGFyZS5udW1lcmljYWxseSk7XG4gIGZvciAoaW5kZXggPSB0b1JlbW92ZS5sZW5ndGggLSAxOyBpbmRleCA+PSAwOyBpbmRleC0tKSB7XG4gICAgaW5kZXgxID0gdG9SZW1vdmVbaW5kZXhdO1xuICAgIHZhciBpbmRleERpZmYgPSBkZWx0YVsnXycgKyBpbmRleDFdO1xuICAgIHZhciByZW1vdmVkVmFsdWUgPSBhcnJheS5zcGxpY2UoaW5kZXgxLCAxKVswXTtcbiAgICBpZiAoaW5kZXhEaWZmWzJdID09PSBBUlJBWV9NT1ZFKSB7XG4gICAgICAvLyByZWluc2VydCBsYXRlclxuICAgICAgdG9JbnNlcnQucHVzaCh7XG4gICAgICAgIGluZGV4OiBpbmRleERpZmZbMV0sXG4gICAgICAgIHZhbHVlOiByZW1vdmVkVmFsdWVcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIGluc2VydCBpdGVtcywgaW4gcmV2ZXJzZSBvcmRlciB0byBhdm9pZCBtb3Zpbmcgb3VyIG93biBmbG9vclxuICB0b0luc2VydCA9IHRvSW5zZXJ0LnNvcnQoY29tcGFyZS5udW1lcmljYWxseUJ5KCdpbmRleCcpKTtcbiAgdmFyIHRvSW5zZXJ0TGVuZ3RoID0gdG9JbnNlcnQubGVuZ3RoO1xuICBmb3IgKGluZGV4ID0gMDsgaW5kZXggPCB0b0luc2VydExlbmd0aDsgaW5kZXgrKykge1xuICAgIHZhciBpbnNlcnRpb24gPSB0b0luc2VydFtpbmRleF07XG4gICAgYXJyYXkuc3BsaWNlKGluc2VydGlvbi5pbmRleCwgMCwgaW5zZXJ0aW9uLnZhbHVlKTtcbiAgfVxuXG4gIC8vIGFwcGx5IG1vZGlmaWNhdGlvbnNcbiAgdmFyIHRvTW9kaWZ5TGVuZ3RoID0gdG9Nb2RpZnkubGVuZ3RoO1xuICB2YXIgY2hpbGQ7XG4gIGlmICh0b01vZGlmeUxlbmd0aCA+IDApIHtcbiAgICBmb3IgKGluZGV4ID0gMDsgaW5kZXggPCB0b01vZGlmeUxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgdmFyIG1vZGlmaWNhdGlvbiA9IHRvTW9kaWZ5W2luZGV4XTtcbiAgICAgIGNoaWxkID0gbmV3IFBhdGNoQ29udGV4dChjb250ZXh0LmxlZnRbbW9kaWZpY2F0aW9uLmluZGV4XSwgbW9kaWZpY2F0aW9uLmRlbHRhKTtcbiAgICAgIGNvbnRleHQucHVzaChjaGlsZCwgbW9kaWZpY2F0aW9uLmluZGV4KTtcbiAgICB9XG4gIH1cblxuICBpZiAoIWNvbnRleHQuY2hpbGRyZW4pIHtcbiAgICBjb250ZXh0LnNldFJlc3VsdChjb250ZXh0LmxlZnQpLmV4aXQoKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29udGV4dC5leGl0KCk7XG59O1xucGF0Y2hGaWx0ZXIuZmlsdGVyTmFtZSA9ICdhcnJheXMnO1xuXG52YXIgY29sbGVjdENoaWxkcmVuUGF0Y2hGaWx0ZXIgPSBmdW5jdGlvbiBjb2xsZWN0Q2hpbGRyZW5QYXRjaEZpbHRlcihjb250ZXh0KSB7XG4gIGlmICghY29udGV4dCB8fCAhY29udGV4dC5jaGlsZHJlbikge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoY29udGV4dC5kZWx0YS5fdCAhPT0gJ2EnKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBsZW5ndGggPSBjb250ZXh0LmNoaWxkcmVuLmxlbmd0aDtcbiAgdmFyIGNoaWxkO1xuICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgY2hpbGQgPSBjb250ZXh0LmNoaWxkcmVuW2luZGV4XTtcbiAgICBjb250ZXh0LmxlZnRbY2hpbGQuY2hpbGROYW1lXSA9IGNoaWxkLnJlc3VsdDtcbiAgfVxuICBjb250ZXh0LnNldFJlc3VsdChjb250ZXh0LmxlZnQpLmV4aXQoKTtcbn07XG5jb2xsZWN0Q2hpbGRyZW5QYXRjaEZpbHRlci5maWx0ZXJOYW1lID0gJ2FycmF5c0NvbGxlY3RDaGlsZHJlbic7XG5cbnZhciByZXZlcnNlRmlsdGVyID0gZnVuY3Rpb24gYXJyYXlzUmV2ZXJzZUZpbHRlcihjb250ZXh0KSB7XG4gIGlmICghY29udGV4dC5uZXN0ZWQpIHtcbiAgICBpZiAoY29udGV4dC5kZWx0YVsyXSA9PT0gQVJSQVlfTU9WRSkge1xuICAgICAgY29udGV4dC5uZXdOYW1lID0gJ18nICsgY29udGV4dC5kZWx0YVsxXTtcbiAgICAgIGNvbnRleHQuc2V0UmVzdWx0KFtjb250ZXh0LmRlbHRhWzBdLCBwYXJzZUludChjb250ZXh0LmNoaWxkTmFtZS5zdWJzdHIoMSksIDEwKSwgQVJSQVlfTU9WRV0pLmV4aXQoKTtcbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChjb250ZXh0LmRlbHRhLl90ICE9PSAnYScpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIG5hbWUsIGNoaWxkO1xuICBmb3IgKG5hbWUgaW4gY29udGV4dC5kZWx0YSkge1xuICAgIGlmIChuYW1lID09PSAnX3QnKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY2hpbGQgPSBuZXcgUmV2ZXJzZUNvbnRleHQoY29udGV4dC5kZWx0YVtuYW1lXSk7XG4gICAgY29udGV4dC5wdXNoKGNoaWxkLCBuYW1lKTtcbiAgfVxuICBjb250ZXh0LmV4aXQoKTtcbn07XG5yZXZlcnNlRmlsdGVyLmZpbHRlck5hbWUgPSAnYXJyYXlzJztcblxudmFyIHJldmVyc2VBcnJheURlbHRhSW5kZXggPSBmdW5jdGlvbihkZWx0YSwgaW5kZXgsIGl0ZW1EZWx0YSkge1xuICBpZiAodHlwZW9mIGluZGV4ID09PSAnc3RyaW5nJyAmJiBpbmRleFswXSA9PT0gJ18nKSB7XG4gICAgcmV0dXJuIHBhcnNlSW50KGluZGV4LnN1YnN0cigxKSwgMTApO1xuICB9IGVsc2UgaWYgKGlzQXJyYXkoaXRlbURlbHRhKSAmJiBpdGVtRGVsdGFbMl0gPT09IDApIHtcbiAgICByZXR1cm4gJ18nICsgaW5kZXg7XG4gIH1cblxuICB2YXIgcmV2ZXJzZUluZGV4ID0gK2luZGV4O1xuICBmb3IgKHZhciBkZWx0YUluZGV4IGluIGRlbHRhKSB7XG4gICAgdmFyIGRlbHRhSXRlbSA9IGRlbHRhW2RlbHRhSW5kZXhdO1xuICAgIGlmIChpc0FycmF5KGRlbHRhSXRlbSkpIHtcbiAgICAgIGlmIChkZWx0YUl0ZW1bMl0gPT09IEFSUkFZX01PVkUpIHtcbiAgICAgICAgdmFyIG1vdmVGcm9tSW5kZXggPSBwYXJzZUludChkZWx0YUluZGV4LnN1YnN0cigxKSwgMTApO1xuICAgICAgICB2YXIgbW92ZVRvSW5kZXggPSBkZWx0YUl0ZW1bMV07XG4gICAgICAgIGlmIChtb3ZlVG9JbmRleCA9PT0gK2luZGV4KSB7XG4gICAgICAgICAgcmV0dXJuIG1vdmVGcm9tSW5kZXg7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1vdmVGcm9tSW5kZXggPD0gcmV2ZXJzZUluZGV4ICYmIG1vdmVUb0luZGV4ID4gcmV2ZXJzZUluZGV4KSB7XG4gICAgICAgICAgcmV2ZXJzZUluZGV4Kys7XG4gICAgICAgIH0gZWxzZSBpZiAobW92ZUZyb21JbmRleCA+PSByZXZlcnNlSW5kZXggJiYgbW92ZVRvSW5kZXggPCByZXZlcnNlSW5kZXgpIHtcbiAgICAgICAgICByZXZlcnNlSW5kZXgtLTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChkZWx0YUl0ZW1bMl0gPT09IDApIHtcbiAgICAgICAgdmFyIGRlbGV0ZUluZGV4ID0gcGFyc2VJbnQoZGVsdGFJbmRleC5zdWJzdHIoMSksIDEwKTtcbiAgICAgICAgaWYgKGRlbGV0ZUluZGV4IDw9IHJldmVyc2VJbmRleCkge1xuICAgICAgICAgIHJldmVyc2VJbmRleCsrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGRlbHRhSXRlbS5sZW5ndGggPT09IDEgJiYgZGVsdGFJbmRleCA8PSByZXZlcnNlSW5kZXgpIHtcbiAgICAgICAgcmV2ZXJzZUluZGV4LS07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJldmVyc2VJbmRleDtcbn07XG5cbnZhciBjb2xsZWN0Q2hpbGRyZW5SZXZlcnNlRmlsdGVyID0gZnVuY3Rpb24gY29sbGVjdENoaWxkcmVuUmV2ZXJzZUZpbHRlcihjb250ZXh0KSB7XG4gIGlmICghY29udGV4dCB8fCAhY29udGV4dC5jaGlsZHJlbikge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoY29udGV4dC5kZWx0YS5fdCAhPT0gJ2EnKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBsZW5ndGggPSBjb250ZXh0LmNoaWxkcmVuLmxlbmd0aDtcbiAgdmFyIGNoaWxkO1xuICB2YXIgZGVsdGEgPSB7XG4gICAgX3Q6ICdhJ1xuICB9O1xuXG4gIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICBjaGlsZCA9IGNvbnRleHQuY2hpbGRyZW5baW5kZXhdO1xuICAgIHZhciBuYW1lID0gY2hpbGQubmV3TmFtZTtcbiAgICBpZiAodHlwZW9mIG5hbWUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBuYW1lID0gcmV2ZXJzZUFycmF5RGVsdGFJbmRleChjb250ZXh0LmRlbHRhLCBjaGlsZC5jaGlsZE5hbWUsIGNoaWxkLnJlc3VsdCk7XG4gICAgfVxuICAgIGlmIChkZWx0YVtuYW1lXSAhPT0gY2hpbGQucmVzdWx0KSB7XG4gICAgICBkZWx0YVtuYW1lXSA9IGNoaWxkLnJlc3VsdDtcbiAgICB9XG4gIH1cbiAgY29udGV4dC5zZXRSZXN1bHQoZGVsdGEpLmV4aXQoKTtcbn07XG5jb2xsZWN0Q2hpbGRyZW5SZXZlcnNlRmlsdGVyLmZpbHRlck5hbWUgPSAnYXJyYXlzQ29sbGVjdENoaWxkcmVuJztcblxuZXhwb3J0cy5kaWZmRmlsdGVyID0gZGlmZkZpbHRlcjtcbmV4cG9ydHMucGF0Y2hGaWx0ZXIgPSBwYXRjaEZpbHRlcjtcbmV4cG9ydHMuY29sbGVjdENoaWxkcmVuUGF0Y2hGaWx0ZXIgPSBjb2xsZWN0Q2hpbGRyZW5QYXRjaEZpbHRlcjtcbmV4cG9ydHMucmV2ZXJzZUZpbHRlciA9IHJldmVyc2VGaWx0ZXI7XG5leHBvcnRzLmNvbGxlY3RDaGlsZHJlblJldmVyc2VGaWx0ZXIgPSBjb2xsZWN0Q2hpbGRyZW5SZXZlcnNlRmlsdGVyO1xuIiwidmFyIGRpZmZGaWx0ZXIgPSBmdW5jdGlvbiBkYXRlc0RpZmZGaWx0ZXIoY29udGV4dCkge1xuICBpZiAoY29udGV4dC5sZWZ0IGluc3RhbmNlb2YgRGF0ZSkge1xuICAgIGlmIChjb250ZXh0LnJpZ2h0IGluc3RhbmNlb2YgRGF0ZSkge1xuICAgICAgaWYgKGNvbnRleHQubGVmdC5nZXRUaW1lKCkgIT09IGNvbnRleHQucmlnaHQuZ2V0VGltZSgpKSB7XG4gICAgICAgIGNvbnRleHQuc2V0UmVzdWx0KFtjb250ZXh0LmxlZnQsIGNvbnRleHQucmlnaHRdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRleHQuc2V0UmVzdWx0KHVuZGVmaW5lZCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRleHQuc2V0UmVzdWx0KFtjb250ZXh0LmxlZnQsIGNvbnRleHQucmlnaHRdKTtcbiAgICB9XG4gICAgY29udGV4dC5leGl0KCk7XG4gIH0gZWxzZSBpZiAoY29udGV4dC5yaWdodCBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICBjb250ZXh0LnNldFJlc3VsdChbY29udGV4dC5sZWZ0LCBjb250ZXh0LnJpZ2h0XSkuZXhpdCgpO1xuICB9XG59O1xuZGlmZkZpbHRlci5maWx0ZXJOYW1lID0gJ2RhdGVzJztcblxuZXhwb3J0cy5kaWZmRmlsdGVyID0gZGlmZkZpbHRlcjtcbiIsIi8qXG5cbkxDUyBpbXBsZW1lbnRhdGlvbiB0aGF0IHN1cHBvcnRzIGFycmF5cyBvciBzdHJpbmdzXG5cbnJlZmVyZW5jZTogaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9Mb25nZXN0X2NvbW1vbl9zdWJzZXF1ZW5jZV9wcm9ibGVtXG5cbiovXG5cbnZhciBkZWZhdWx0TWF0Y2ggPSBmdW5jdGlvbihhcnJheTEsIGFycmF5MiwgaW5kZXgxLCBpbmRleDIpIHtcbiAgcmV0dXJuIGFycmF5MVtpbmRleDFdID09PSBhcnJheTJbaW5kZXgyXTtcbn07XG5cbnZhciBsZW5ndGhNYXRyaXggPSBmdW5jdGlvbihhcnJheTEsIGFycmF5MiwgbWF0Y2gsIGNvbnRleHQpIHtcbiAgdmFyIGxlbjEgPSBhcnJheTEubGVuZ3RoO1xuICB2YXIgbGVuMiA9IGFycmF5Mi5sZW5ndGg7XG4gIHZhciB4LCB5O1xuXG4gIC8vIGluaXRpYWxpemUgZW1wdHkgbWF0cml4IG9mIGxlbjErMSB4IGxlbjIrMVxuICB2YXIgbWF0cml4ID0gW2xlbjEgKyAxXTtcbiAgZm9yICh4ID0gMDsgeCA8IGxlbjEgKyAxOyB4KyspIHtcbiAgICBtYXRyaXhbeF0gPSBbbGVuMiArIDFdO1xuICAgIGZvciAoeSA9IDA7IHkgPCBsZW4yICsgMTsgeSsrKSB7XG4gICAgICBtYXRyaXhbeF1beV0gPSAwO1xuICAgIH1cbiAgfVxuICBtYXRyaXgubWF0Y2ggPSBtYXRjaDtcbiAgLy8gc2F2ZSBzZXF1ZW5jZSBsZW5ndGhzIGZvciBlYWNoIGNvb3JkaW5hdGVcbiAgZm9yICh4ID0gMTsgeCA8IGxlbjEgKyAxOyB4KyspIHtcbiAgICBmb3IgKHkgPSAxOyB5IDwgbGVuMiArIDE7IHkrKykge1xuICAgICAgaWYgKG1hdGNoKGFycmF5MSwgYXJyYXkyLCB4IC0gMSwgeSAtIDEsIGNvbnRleHQpKSB7XG4gICAgICAgIG1hdHJpeFt4XVt5XSA9IG1hdHJpeFt4IC0gMV1beSAtIDFdICsgMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1hdHJpeFt4XVt5XSA9IE1hdGgubWF4KG1hdHJpeFt4IC0gMV1beV0sIG1hdHJpeFt4XVt5IC0gMV0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbWF0cml4O1xufTtcblxudmFyIGJhY2t0cmFjayA9IGZ1bmN0aW9uKG1hdHJpeCwgYXJyYXkxLCBhcnJheTIsIGluZGV4MSwgaW5kZXgyLCBjb250ZXh0KSB7XG4gIGlmIChpbmRleDEgPT09IDAgfHwgaW5kZXgyID09PSAwKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNlcXVlbmNlOiBbXSxcbiAgICAgIGluZGljZXMxOiBbXSxcbiAgICAgIGluZGljZXMyOiBbXVxuICAgIH07XG4gIH1cblxuICBpZiAobWF0cml4Lm1hdGNoKGFycmF5MSwgYXJyYXkyLCBpbmRleDEgLSAxLCBpbmRleDIgLSAxLCBjb250ZXh0KSkge1xuICAgIHZhciBzdWJzZXF1ZW5jZSA9IGJhY2t0cmFjayhtYXRyaXgsIGFycmF5MSwgYXJyYXkyLCBpbmRleDEgLSAxLCBpbmRleDIgLSAxLCBjb250ZXh0KTtcbiAgICBzdWJzZXF1ZW5jZS5zZXF1ZW5jZS5wdXNoKGFycmF5MVtpbmRleDEgLSAxXSk7XG4gICAgc3Vic2VxdWVuY2UuaW5kaWNlczEucHVzaChpbmRleDEgLSAxKTtcbiAgICBzdWJzZXF1ZW5jZS5pbmRpY2VzMi5wdXNoKGluZGV4MiAtIDEpO1xuICAgIHJldHVybiBzdWJzZXF1ZW5jZTtcbiAgfVxuXG4gIGlmIChtYXRyaXhbaW5kZXgxXVtpbmRleDIgLSAxXSA+IG1hdHJpeFtpbmRleDEgLSAxXVtpbmRleDJdKSB7XG4gICAgcmV0dXJuIGJhY2t0cmFjayhtYXRyaXgsIGFycmF5MSwgYXJyYXkyLCBpbmRleDEsIGluZGV4MiAtIDEsIGNvbnRleHQpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBiYWNrdHJhY2sobWF0cml4LCBhcnJheTEsIGFycmF5MiwgaW5kZXgxIC0gMSwgaW5kZXgyLCBjb250ZXh0KTtcbiAgfVxufTtcblxudmFyIGdldCA9IGZ1bmN0aW9uKGFycmF5MSwgYXJyYXkyLCBtYXRjaCwgY29udGV4dCkge1xuICBjb250ZXh0ID0gY29udGV4dCB8fCB7fTtcbiAgdmFyIG1hdHJpeCA9IGxlbmd0aE1hdHJpeChhcnJheTEsIGFycmF5MiwgbWF0Y2ggfHwgZGVmYXVsdE1hdGNoLCBjb250ZXh0KTtcbiAgdmFyIHJlc3VsdCA9IGJhY2t0cmFjayhtYXRyaXgsIGFycmF5MSwgYXJyYXkyLCBhcnJheTEubGVuZ3RoLCBhcnJheTIubGVuZ3RoLCBjb250ZXh0KTtcbiAgaWYgKHR5cGVvZiBhcnJheTEgPT09ICdzdHJpbmcnICYmIHR5cGVvZiBhcnJheTIgPT09ICdzdHJpbmcnKSB7XG4gICAgcmVzdWx0LnNlcXVlbmNlID0gcmVzdWx0LnNlcXVlbmNlLmpvaW4oJycpO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5leHBvcnRzLmdldCA9IGdldDtcbiIsInZhciBEaWZmQ29udGV4dCA9IHJlcXVpcmUoJy4uL2NvbnRleHRzL2RpZmYnKS5EaWZmQ29udGV4dDtcbnZhciBQYXRjaENvbnRleHQgPSByZXF1aXJlKCcuLi9jb250ZXh0cy9wYXRjaCcpLlBhdGNoQ29udGV4dDtcbnZhciBSZXZlcnNlQ29udGV4dCA9IHJlcXVpcmUoJy4uL2NvbnRleHRzL3JldmVyc2UnKS5SZXZlcnNlQ29udGV4dDtcblxudmFyIGNvbGxlY3RDaGlsZHJlbkRpZmZGaWx0ZXIgPSBmdW5jdGlvbiBjb2xsZWN0Q2hpbGRyZW5EaWZmRmlsdGVyKGNvbnRleHQpIHtcbiAgaWYgKCFjb250ZXh0IHx8ICFjb250ZXh0LmNoaWxkcmVuKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBsZW5ndGggPSBjb250ZXh0LmNoaWxkcmVuLmxlbmd0aDtcbiAgdmFyIGNoaWxkO1xuICB2YXIgcmVzdWx0ID0gY29udGV4dC5yZXN1bHQ7XG4gIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICBjaGlsZCA9IGNvbnRleHQuY2hpbGRyZW5baW5kZXhdO1xuICAgIGlmICh0eXBlb2YgY2hpbGQucmVzdWx0ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIHJlc3VsdCA9IHJlc3VsdCB8fCB7fTtcbiAgICByZXN1bHRbY2hpbGQuY2hpbGROYW1lXSA9IGNoaWxkLnJlc3VsdDtcbiAgfVxuICBpZiAocmVzdWx0ICYmIGNvbnRleHQubGVmdElzQXJyYXkpIHtcbiAgICByZXN1bHQuX3QgPSAnYSc7XG4gIH1cbiAgY29udGV4dC5zZXRSZXN1bHQocmVzdWx0KS5leGl0KCk7XG59O1xuY29sbGVjdENoaWxkcmVuRGlmZkZpbHRlci5maWx0ZXJOYW1lID0gJ2NvbGxlY3RDaGlsZHJlbic7XG5cbnZhciBvYmplY3RzRGlmZkZpbHRlciA9IGZ1bmN0aW9uIG9iamVjdHNEaWZmRmlsdGVyKGNvbnRleHQpIHtcbiAgaWYgKGNvbnRleHQubGVmdElzQXJyYXkgfHwgY29udGV4dC5sZWZ0VHlwZSAhPT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgbmFtZSwgY2hpbGQ7XG4gIGZvciAobmFtZSBpbiBjb250ZXh0LmxlZnQpIHtcbiAgICBjaGlsZCA9IG5ldyBEaWZmQ29udGV4dChjb250ZXh0LmxlZnRbbmFtZV0sIGNvbnRleHQucmlnaHRbbmFtZV0pO1xuICAgIGNvbnRleHQucHVzaChjaGlsZCwgbmFtZSk7XG4gIH1cbiAgZm9yIChuYW1lIGluIGNvbnRleHQucmlnaHQpIHtcbiAgICBpZiAodHlwZW9mIGNvbnRleHQubGVmdFtuYW1lXSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGNoaWxkID0gbmV3IERpZmZDb250ZXh0KHVuZGVmaW5lZCwgY29udGV4dC5yaWdodFtuYW1lXSk7XG4gICAgICBjb250ZXh0LnB1c2goY2hpbGQsIG5hbWUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghY29udGV4dC5jaGlsZHJlbiB8fCBjb250ZXh0LmNoaWxkcmVuLmxlbmd0aCA9PT0gMCkge1xuICAgIGNvbnRleHQuc2V0UmVzdWx0KHVuZGVmaW5lZCkuZXhpdCgpO1xuICAgIHJldHVybjtcbiAgfVxuICBjb250ZXh0LmV4aXQoKTtcbn07XG5vYmplY3RzRGlmZkZpbHRlci5maWx0ZXJOYW1lID0gJ29iamVjdHMnO1xuXG52YXIgcGF0Y2hGaWx0ZXIgPSBmdW5jdGlvbiBuZXN0ZWRQYXRjaEZpbHRlcihjb250ZXh0KSB7XG4gIGlmICghY29udGV4dC5uZXN0ZWQpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKGNvbnRleHQuZGVsdGEuX3QpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIG5hbWUsIGNoaWxkO1xuICBmb3IgKG5hbWUgaW4gY29udGV4dC5kZWx0YSkge1xuICAgIGNoaWxkID0gbmV3IFBhdGNoQ29udGV4dChjb250ZXh0LmxlZnRbbmFtZV0sIGNvbnRleHQuZGVsdGFbbmFtZV0pO1xuICAgIGNvbnRleHQucHVzaChjaGlsZCwgbmFtZSk7XG4gIH1cbiAgY29udGV4dC5leGl0KCk7XG59O1xucGF0Y2hGaWx0ZXIuZmlsdGVyTmFtZSA9ICdvYmplY3RzJztcblxudmFyIGNvbGxlY3RDaGlsZHJlblBhdGNoRmlsdGVyID0gZnVuY3Rpb24gY29sbGVjdENoaWxkcmVuUGF0Y2hGaWx0ZXIoY29udGV4dCkge1xuICBpZiAoIWNvbnRleHQgfHwgIWNvbnRleHQuY2hpbGRyZW4pIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKGNvbnRleHQuZGVsdGEuX3QpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIGxlbmd0aCA9IGNvbnRleHQuY2hpbGRyZW4ubGVuZ3RoO1xuICB2YXIgY2hpbGQ7XG4gIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICBjaGlsZCA9IGNvbnRleHQuY2hpbGRyZW5baW5kZXhdO1xuICAgIGlmIChjb250ZXh0LmxlZnQuaGFzT3duUHJvcGVydHkoY2hpbGQuY2hpbGROYW1lKSAmJiBjaGlsZC5yZXN1bHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgZGVsZXRlIGNvbnRleHQubGVmdFtjaGlsZC5jaGlsZE5hbWVdO1xuICAgIH0gZWxzZSBpZiAoY29udGV4dC5sZWZ0W2NoaWxkLmNoaWxkTmFtZV0gIT09IGNoaWxkLnJlc3VsdCkge1xuICAgICAgY29udGV4dC5sZWZ0W2NoaWxkLmNoaWxkTmFtZV0gPSBjaGlsZC5yZXN1bHQ7XG4gICAgfVxuICB9XG4gIGNvbnRleHQuc2V0UmVzdWx0KGNvbnRleHQubGVmdCkuZXhpdCgpO1xufTtcbmNvbGxlY3RDaGlsZHJlblBhdGNoRmlsdGVyLmZpbHRlck5hbWUgPSAnY29sbGVjdENoaWxkcmVuJztcblxudmFyIHJldmVyc2VGaWx0ZXIgPSBmdW5jdGlvbiBuZXN0ZWRSZXZlcnNlRmlsdGVyKGNvbnRleHQpIHtcbiAgaWYgKCFjb250ZXh0Lm5lc3RlZCkge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoY29udGV4dC5kZWx0YS5fdCkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgbmFtZSwgY2hpbGQ7XG4gIGZvciAobmFtZSBpbiBjb250ZXh0LmRlbHRhKSB7XG4gICAgY2hpbGQgPSBuZXcgUmV2ZXJzZUNvbnRleHQoY29udGV4dC5kZWx0YVtuYW1lXSk7XG4gICAgY29udGV4dC5wdXNoKGNoaWxkLCBuYW1lKTtcbiAgfVxuICBjb250ZXh0LmV4aXQoKTtcbn07XG5yZXZlcnNlRmlsdGVyLmZpbHRlck5hbWUgPSAnb2JqZWN0cyc7XG5cbnZhciBjb2xsZWN0Q2hpbGRyZW5SZXZlcnNlRmlsdGVyID0gZnVuY3Rpb24gY29sbGVjdENoaWxkcmVuUmV2ZXJzZUZpbHRlcihjb250ZXh0KSB7XG4gIGlmICghY29udGV4dCB8fCAhY29udGV4dC5jaGlsZHJlbikge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoY29udGV4dC5kZWx0YS5fdCkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgbGVuZ3RoID0gY29udGV4dC5jaGlsZHJlbi5sZW5ndGg7XG4gIHZhciBjaGlsZDtcbiAgdmFyIGRlbHRhID0ge307XG4gIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICBjaGlsZCA9IGNvbnRleHQuY2hpbGRyZW5baW5kZXhdO1xuICAgIGlmIChkZWx0YVtjaGlsZC5jaGlsZE5hbWVdICE9PSBjaGlsZC5yZXN1bHQpIHtcbiAgICAgIGRlbHRhW2NoaWxkLmNoaWxkTmFtZV0gPSBjaGlsZC5yZXN1bHQ7XG4gICAgfVxuICB9XG4gIGNvbnRleHQuc2V0UmVzdWx0KGRlbHRhKS5leGl0KCk7XG59O1xuY29sbGVjdENoaWxkcmVuUmV2ZXJzZUZpbHRlci5maWx0ZXJOYW1lID0gJ2NvbGxlY3RDaGlsZHJlbic7XG5cbmV4cG9ydHMuY29sbGVjdENoaWxkcmVuRGlmZkZpbHRlciA9IGNvbGxlY3RDaGlsZHJlbkRpZmZGaWx0ZXI7XG5leHBvcnRzLm9iamVjdHNEaWZmRmlsdGVyID0gb2JqZWN0c0RpZmZGaWx0ZXI7XG5leHBvcnRzLnBhdGNoRmlsdGVyID0gcGF0Y2hGaWx0ZXI7XG5leHBvcnRzLmNvbGxlY3RDaGlsZHJlblBhdGNoRmlsdGVyID0gY29sbGVjdENoaWxkcmVuUGF0Y2hGaWx0ZXI7XG5leHBvcnRzLnJldmVyc2VGaWx0ZXIgPSByZXZlcnNlRmlsdGVyO1xuZXhwb3J0cy5jb2xsZWN0Q2hpbGRyZW5SZXZlcnNlRmlsdGVyID0gY29sbGVjdENoaWxkcmVuUmV2ZXJzZUZpbHRlcjtcbiIsIi8qIGdsb2JhbCBkaWZmX21hdGNoX3BhdGNoICovXG52YXIgVEVYVF9ESUZGID0gMjtcbnZhciBERUZBVUxUX01JTl9MRU5HVEggPSA2MDtcbnZhciBjYWNoZWREaWZmUGF0Y2ggPSBudWxsO1xuXG52YXIgZ2V0RGlmZk1hdGNoUGF0Y2ggPSBmdW5jdGlvbigpIHtcbiAgLypqc2hpbnQgY2FtZWxjYXNlOiBmYWxzZSAqL1xuXG4gIGlmICghY2FjaGVkRGlmZlBhdGNoKSB7XG4gICAgdmFyIGluc3RhbmNlO1xuICAgIGlmICh0eXBlb2YgZGlmZl9tYXRjaF9wYXRjaCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIC8vIGFscmVhZHkgbG9hZGVkLCBwcm9iYWJseSBhIGJyb3dzZXJcbiAgICAgIGluc3RhbmNlID0gdHlwZW9mIGRpZmZfbWF0Y2hfcGF0Y2ggPT09ICdmdW5jdGlvbicgP1xuICAgICAgICBuZXcgZGlmZl9tYXRjaF9wYXRjaCgpIDogbmV3IGRpZmZfbWF0Y2hfcGF0Y2guZGlmZl9tYXRjaF9wYXRjaCgpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHJlcXVpcmUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHZhciBkbXBNb2R1bGVOYW1lID0gJ2RpZmZfbWF0Y2hfcGF0Y2hfdW5jb21wcmVzc2VkJztcbiAgICAgICAgdmFyIGRtcCA9IHJlcXVpcmUoJy4uLy4uL3B1YmxpYy9leHRlcm5hbC8nICsgZG1wTW9kdWxlTmFtZSk7XG4gICAgICAgIGluc3RhbmNlID0gbmV3IGRtcC5kaWZmX21hdGNoX3BhdGNoKCk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgaW5zdGFuY2UgPSBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWluc3RhbmNlKSB7XG4gICAgICB2YXIgZXJyb3IgPSBuZXcgRXJyb3IoJ3RleHQgZGlmZl9tYXRjaF9wYXRjaCBsaWJyYXJ5IG5vdCBmb3VuZCcpO1xuICAgICAgZXJyb3IuZGlmZl9tYXRjaF9wYXRjaF9ub3RfZm91bmQgPSB0cnVlO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICAgIGNhY2hlZERpZmZQYXRjaCA9IHtcbiAgICAgIGRpZmY6IGZ1bmN0aW9uKHR4dDEsIHR4dDIpIHtcbiAgICAgICAgcmV0dXJuIGluc3RhbmNlLnBhdGNoX3RvVGV4dChpbnN0YW5jZS5wYXRjaF9tYWtlKHR4dDEsIHR4dDIpKTtcbiAgICAgIH0sXG4gICAgICBwYXRjaDogZnVuY3Rpb24odHh0MSwgcGF0Y2gpIHtcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBpbnN0YW5jZS5wYXRjaF9hcHBseShpbnN0YW5jZS5wYXRjaF9mcm9tVGV4dChwYXRjaCksIHR4dDEpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlc3VsdHNbMV0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAoIXJlc3VsdHNbMV1baV0pIHtcbiAgICAgICAgICAgIHZhciBlcnJvciA9IG5ldyBFcnJvcigndGV4dCBwYXRjaCBmYWlsZWQnKTtcbiAgICAgICAgICAgIGVycm9yLnRleHRQYXRjaEZhaWxlZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHRzWzBdO1xuICAgICAgfVxuICAgIH07XG4gIH1cbiAgcmV0dXJuIGNhY2hlZERpZmZQYXRjaDtcbn07XG5cbnZhciBkaWZmRmlsdGVyID0gZnVuY3Rpb24gdGV4dHNEaWZmRmlsdGVyKGNvbnRleHQpIHtcbiAgaWYgKGNvbnRleHQubGVmdFR5cGUgIT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBtaW5MZW5ndGggPSAoY29udGV4dC5vcHRpb25zICYmIGNvbnRleHQub3B0aW9ucy50ZXh0RGlmZiAmJlxuICAgIGNvbnRleHQub3B0aW9ucy50ZXh0RGlmZi5taW5MZW5ndGgpIHx8IERFRkFVTFRfTUlOX0xFTkdUSDtcbiAgaWYgKGNvbnRleHQubGVmdC5sZW5ndGggPCBtaW5MZW5ndGggfHxcbiAgICBjb250ZXh0LnJpZ2h0Lmxlbmd0aCA8IG1pbkxlbmd0aCkge1xuICAgIGNvbnRleHQuc2V0UmVzdWx0KFtjb250ZXh0LmxlZnQsIGNvbnRleHQucmlnaHRdKS5leGl0KCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIC8vIGxhcmdlIHRleHQsIHVzZSBhIHRleHQtZGlmZiBhbGdvcml0aG1cbiAgdmFyIGRpZmYgPSBnZXREaWZmTWF0Y2hQYXRjaCgpLmRpZmY7XG4gIGNvbnRleHQuc2V0UmVzdWx0KFtkaWZmKGNvbnRleHQubGVmdCwgY29udGV4dC5yaWdodCksIDAsIFRFWFRfRElGRl0pLmV4aXQoKTtcbn07XG5kaWZmRmlsdGVyLmZpbHRlck5hbWUgPSAndGV4dHMnO1xuXG52YXIgcGF0Y2hGaWx0ZXIgPSBmdW5jdGlvbiB0ZXh0c1BhdGNoRmlsdGVyKGNvbnRleHQpIHtcbiAgaWYgKGNvbnRleHQubmVzdGVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChjb250ZXh0LmRlbHRhWzJdICE9PSBURVhUX0RJRkYpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyB0ZXh0LWRpZmYsIHVzZSBhIHRleHQtcGF0Y2ggYWxnb3JpdGhtXG4gIHZhciBwYXRjaCA9IGdldERpZmZNYXRjaFBhdGNoKCkucGF0Y2g7XG4gIGNvbnRleHQuc2V0UmVzdWx0KHBhdGNoKGNvbnRleHQubGVmdCwgY29udGV4dC5kZWx0YVswXSkpLmV4aXQoKTtcbn07XG5wYXRjaEZpbHRlci5maWx0ZXJOYW1lID0gJ3RleHRzJztcblxudmFyIHRleHREZWx0YVJldmVyc2UgPSBmdW5jdGlvbihkZWx0YSkge1xuICB2YXIgaSwgbCwgbGluZXMsIGxpbmUsIGxpbmVUbXAsIGhlYWRlciA9IG51bGwsXG4gICAgaGVhZGVyUmVnZXggPSAvXkBAICtcXC0oXFxkKyksKFxcZCspICtcXCsoXFxkKyksKFxcZCspICtAQCQvLFxuICAgIGxpbmVIZWFkZXIsIGxpbmVBZGQsIGxpbmVSZW1vdmU7XG4gIGxpbmVzID0gZGVsdGEuc3BsaXQoJ1xcbicpO1xuICBmb3IgKGkgPSAwLCBsID0gbGluZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgbGluZSA9IGxpbmVzW2ldO1xuICAgIHZhciBsaW5lU3RhcnQgPSBsaW5lLnNsaWNlKDAsIDEpO1xuICAgIGlmIChsaW5lU3RhcnQgPT09ICdAJykge1xuICAgICAgaGVhZGVyID0gaGVhZGVyUmVnZXguZXhlYyhsaW5lKTtcbiAgICAgIGxpbmVIZWFkZXIgPSBpO1xuICAgICAgbGluZUFkZCA9IG51bGw7XG4gICAgICBsaW5lUmVtb3ZlID0gbnVsbDtcblxuICAgICAgLy8gZml4IGhlYWRlclxuICAgICAgbGluZXNbbGluZUhlYWRlcl0gPSAnQEAgLScgKyBoZWFkZXJbM10gKyAnLCcgKyBoZWFkZXJbNF0gKyAnICsnICsgaGVhZGVyWzFdICsgJywnICsgaGVhZGVyWzJdICsgJyBAQCc7XG4gICAgfSBlbHNlIGlmIChsaW5lU3RhcnQgPT09ICcrJykge1xuICAgICAgbGluZUFkZCA9IGk7XG4gICAgICBsaW5lc1tpXSA9ICctJyArIGxpbmVzW2ldLnNsaWNlKDEpO1xuICAgICAgaWYgKGxpbmVzW2kgLSAxXS5zbGljZSgwLCAxKSA9PT0gJysnKSB7XG4gICAgICAgIC8vIHN3YXAgbGluZXMgdG8ga2VlcCBkZWZhdWx0IG9yZGVyICgtKylcbiAgICAgICAgbGluZVRtcCA9IGxpbmVzW2ldO1xuICAgICAgICBsaW5lc1tpXSA9IGxpbmVzW2kgLSAxXTtcbiAgICAgICAgbGluZXNbaSAtIDFdID0gbGluZVRtcDtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGxpbmVTdGFydCA9PT0gJy0nKSB7XG4gICAgICBsaW5lUmVtb3ZlID0gaTtcbiAgICAgIGxpbmVzW2ldID0gJysnICsgbGluZXNbaV0uc2xpY2UoMSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBsaW5lcy5qb2luKCdcXG4nKTtcbn07XG5cbnZhciByZXZlcnNlRmlsdGVyID0gZnVuY3Rpb24gdGV4dHNSZXZlcnNlRmlsdGVyKGNvbnRleHQpIHtcbiAgaWYgKGNvbnRleHQubmVzdGVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChjb250ZXh0LmRlbHRhWzJdICE9PSBURVhUX0RJRkYpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyB0ZXh0LWRpZmYsIHVzZSBhIHRleHQtZGlmZiBhbGdvcml0aG1cbiAgY29udGV4dC5zZXRSZXN1bHQoW3RleHREZWx0YVJldmVyc2UoY29udGV4dC5kZWx0YVswXSksIDAsIFRFWFRfRElGRl0pLmV4aXQoKTtcbn07XG5yZXZlcnNlRmlsdGVyLmZpbHRlck5hbWUgPSAndGV4dHMnO1xuXG5leHBvcnRzLmRpZmZGaWx0ZXIgPSBkaWZmRmlsdGVyO1xuZXhwb3J0cy5wYXRjaEZpbHRlciA9IHBhdGNoRmlsdGVyO1xuZXhwb3J0cy5yZXZlcnNlRmlsdGVyID0gcmV2ZXJzZUZpbHRlcjtcbiIsInZhciBpc0FycmF5ID0gKHR5cGVvZiBBcnJheS5pc0FycmF5ID09PSAnZnVuY3Rpb24nKSA/XG4gIC8vIHVzZSBuYXRpdmUgZnVuY3Rpb25cbiAgQXJyYXkuaXNBcnJheSA6XG4gIC8vIHVzZSBpbnN0YW5jZW9mIG9wZXJhdG9yXG4gIGZ1bmN0aW9uKGEpIHtcbiAgICByZXR1cm4gYSBpbnN0YW5jZW9mIEFycmF5O1xuICB9O1xuXG52YXIgZGlmZkZpbHRlciA9IGZ1bmN0aW9uIHRyaXZpYWxNYXRjaGVzRGlmZkZpbHRlcihjb250ZXh0KSB7XG4gIGlmIChjb250ZXh0LmxlZnQgPT09IGNvbnRleHQucmlnaHQpIHtcbiAgICBjb250ZXh0LnNldFJlc3VsdCh1bmRlZmluZWQpLmV4aXQoKTtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKHR5cGVvZiBjb250ZXh0LmxlZnQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKHR5cGVvZiBjb250ZXh0LnJpZ2h0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Z1bmN0aW9ucyBhcmUgbm90IHN1cHBvcnRlZCcpO1xuICAgIH1cbiAgICBjb250ZXh0LnNldFJlc3VsdChbY29udGV4dC5yaWdodF0pLmV4aXQoKTtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKHR5cGVvZiBjb250ZXh0LnJpZ2h0ID09PSAndW5kZWZpbmVkJykge1xuICAgIGNvbnRleHQuc2V0UmVzdWx0KFtjb250ZXh0LmxlZnQsIDAsIDBdKS5leGl0KCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmICh0eXBlb2YgY29udGV4dC5sZWZ0ID09PSAnZnVuY3Rpb24nIHx8IHR5cGVvZiBjb250ZXh0LnJpZ2h0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdmdW5jdGlvbnMgYXJlIG5vdCBzdXBwb3J0ZWQnKTtcbiAgfVxuICBjb250ZXh0LmxlZnRUeXBlID0gY29udGV4dC5sZWZ0ID09PSBudWxsID8gJ251bGwnIDogdHlwZW9mIGNvbnRleHQubGVmdDtcbiAgY29udGV4dC5yaWdodFR5cGUgPSBjb250ZXh0LnJpZ2h0ID09PSBudWxsID8gJ251bGwnIDogdHlwZW9mIGNvbnRleHQucmlnaHQ7XG4gIGlmIChjb250ZXh0LmxlZnRUeXBlICE9PSBjb250ZXh0LnJpZ2h0VHlwZSkge1xuICAgIGNvbnRleHQuc2V0UmVzdWx0KFtjb250ZXh0LmxlZnQsIGNvbnRleHQucmlnaHRdKS5leGl0KCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChjb250ZXh0LmxlZnRUeXBlID09PSAnYm9vbGVhbicgfHwgY29udGV4dC5sZWZ0VHlwZSA9PT0gJ251bWJlcicpIHtcbiAgICBjb250ZXh0LnNldFJlc3VsdChbY29udGV4dC5sZWZ0LCBjb250ZXh0LnJpZ2h0XSkuZXhpdCgpO1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoY29udGV4dC5sZWZ0VHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICBjb250ZXh0LmxlZnRJc0FycmF5ID0gaXNBcnJheShjb250ZXh0LmxlZnQpO1xuICB9XG4gIGlmIChjb250ZXh0LnJpZ2h0VHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICBjb250ZXh0LnJpZ2h0SXNBcnJheSA9IGlzQXJyYXkoY29udGV4dC5yaWdodCk7XG4gIH1cbiAgaWYgKGNvbnRleHQubGVmdElzQXJyYXkgIT09IGNvbnRleHQucmlnaHRJc0FycmF5KSB7XG4gICAgY29udGV4dC5zZXRSZXN1bHQoW2NvbnRleHQubGVmdCwgY29udGV4dC5yaWdodF0pLmV4aXQoKTtcbiAgICByZXR1cm47XG4gIH1cbn07XG5kaWZmRmlsdGVyLmZpbHRlck5hbWUgPSAndHJpdmlhbCc7XG5cbnZhciBwYXRjaEZpbHRlciA9IGZ1bmN0aW9uIHRyaXZpYWxNYXRjaGVzUGF0Y2hGaWx0ZXIoY29udGV4dCkge1xuICBpZiAodHlwZW9mIGNvbnRleHQuZGVsdGEgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgY29udGV4dC5zZXRSZXN1bHQoY29udGV4dC5sZWZ0KS5leGl0KCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnRleHQubmVzdGVkID0gIWlzQXJyYXkoY29udGV4dC5kZWx0YSk7XG4gIGlmIChjb250ZXh0Lm5lc3RlZCkge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoY29udGV4dC5kZWx0YS5sZW5ndGggPT09IDEpIHtcbiAgICBjb250ZXh0LnNldFJlc3VsdChjb250ZXh0LmRlbHRhWzBdKS5leGl0KCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChjb250ZXh0LmRlbHRhLmxlbmd0aCA9PT0gMikge1xuICAgIGNvbnRleHQuc2V0UmVzdWx0KGNvbnRleHQuZGVsdGFbMV0pLmV4aXQoKTtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKGNvbnRleHQuZGVsdGEubGVuZ3RoID09PSAzICYmIGNvbnRleHQuZGVsdGFbMl0gPT09IDApIHtcbiAgICBjb250ZXh0LnNldFJlc3VsdCh1bmRlZmluZWQpLmV4aXQoKTtcbiAgICByZXR1cm47XG4gIH1cbn07XG5wYXRjaEZpbHRlci5maWx0ZXJOYW1lID0gJ3RyaXZpYWwnO1xuXG52YXIgcmV2ZXJzZUZpbHRlciA9IGZ1bmN0aW9uIHRyaXZpYWxSZWZlcnNlRmlsdGVyKGNvbnRleHQpIHtcbiAgaWYgKHR5cGVvZiBjb250ZXh0LmRlbHRhID09PSAndW5kZWZpbmVkJykge1xuICAgIGNvbnRleHQuc2V0UmVzdWx0KGNvbnRleHQuZGVsdGEpLmV4aXQoKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29udGV4dC5uZXN0ZWQgPSAhaXNBcnJheShjb250ZXh0LmRlbHRhKTtcbiAgaWYgKGNvbnRleHQubmVzdGVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChjb250ZXh0LmRlbHRhLmxlbmd0aCA9PT0gMSkge1xuICAgIGNvbnRleHQuc2V0UmVzdWx0KFtjb250ZXh0LmRlbHRhWzBdLCAwLCAwXSkuZXhpdCgpO1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoY29udGV4dC5kZWx0YS5sZW5ndGggPT09IDIpIHtcbiAgICBjb250ZXh0LnNldFJlc3VsdChbY29udGV4dC5kZWx0YVsxXSwgY29udGV4dC5kZWx0YVswXV0pLmV4aXQoKTtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKGNvbnRleHQuZGVsdGEubGVuZ3RoID09PSAzICYmIGNvbnRleHQuZGVsdGFbMl0gPT09IDApIHtcbiAgICBjb250ZXh0LnNldFJlc3VsdChbY29udGV4dC5kZWx0YVswXV0pLmV4aXQoKTtcbiAgICByZXR1cm47XG4gIH1cbn07XG5yZXZlcnNlRmlsdGVyLmZpbHRlck5hbWUgPSAndHJpdmlhbCc7XG5cbmV4cG9ydHMuZGlmZkZpbHRlciA9IGRpZmZGaWx0ZXI7XG5leHBvcnRzLnBhdGNoRmlsdGVyID0gcGF0Y2hGaWx0ZXI7XG5leHBvcnRzLnJldmVyc2VGaWx0ZXIgPSByZXZlcnNlRmlsdGVyO1xuIiwiXG52YXIgZW52aXJvbm1lbnQgPSByZXF1aXJlKCcuL2Vudmlyb25tZW50Jyk7XG5cbnZhciBEaWZmUGF0Y2hlciA9IHJlcXVpcmUoJy4vZGlmZnBhdGNoZXInKS5EaWZmUGF0Y2hlcjtcbmV4cG9ydHMuRGlmZlBhdGNoZXIgPSBEaWZmUGF0Y2hlcjtcblxuZXhwb3J0cy5jcmVhdGUgPSBmdW5jdGlvbihvcHRpb25zKXtcblx0cmV0dXJuIG5ldyBEaWZmUGF0Y2hlcihvcHRpb25zKTtcbn07XG5cbmV4cG9ydHMuZGF0ZVJldml2ZXIgPSByZXF1aXJlKCcuL2RhdGUtcmV2aXZlcicpO1xuXG52YXIgZGVmYXVsdEluc3RhbmNlO1xuXG5leHBvcnRzLmRpZmYgPSBmdW5jdGlvbigpIHtcblx0aWYgKCFkZWZhdWx0SW5zdGFuY2UpIHtcblx0XHRkZWZhdWx0SW5zdGFuY2UgPSBuZXcgRGlmZlBhdGNoZXIoKTtcblx0fVxuXHRyZXR1cm4gZGVmYXVsdEluc3RhbmNlLmRpZmYuYXBwbHkoZGVmYXVsdEluc3RhbmNlLCBhcmd1bWVudHMpO1xufTtcblxuZXhwb3J0cy5wYXRjaCA9IGZ1bmN0aW9uKCkge1xuXHRpZiAoIWRlZmF1bHRJbnN0YW5jZSkge1xuXHRcdGRlZmF1bHRJbnN0YW5jZSA9IG5ldyBEaWZmUGF0Y2hlcigpO1xuXHR9XG5cdHJldHVybiBkZWZhdWx0SW5zdGFuY2UucGF0Y2guYXBwbHkoZGVmYXVsdEluc3RhbmNlLCBhcmd1bWVudHMpO1xufTtcblxuZXhwb3J0cy51bnBhdGNoID0gZnVuY3Rpb24oKSB7XG5cdGlmICghZGVmYXVsdEluc3RhbmNlKSB7XG5cdFx0ZGVmYXVsdEluc3RhbmNlID0gbmV3IERpZmZQYXRjaGVyKCk7XG5cdH1cblx0cmV0dXJuIGRlZmF1bHRJbnN0YW5jZS51bnBhdGNoLmFwcGx5KGRlZmF1bHRJbnN0YW5jZSwgYXJndW1lbnRzKTtcbn07XG5cbmV4cG9ydHMucmV2ZXJzZSA9IGZ1bmN0aW9uKCkge1xuXHRpZiAoIWRlZmF1bHRJbnN0YW5jZSkge1xuXHRcdGRlZmF1bHRJbnN0YW5jZSA9IG5ldyBEaWZmUGF0Y2hlcigpO1xuXHR9XG5cdHJldHVybiBkZWZhdWx0SW5zdGFuY2UucmV2ZXJzZS5hcHBseShkZWZhdWx0SW5zdGFuY2UsIGFyZ3VtZW50cyk7XG59O1xuXG5pZiAoZW52aXJvbm1lbnQuaXNCcm93c2VyKSB7XG5cdGV4cG9ydHMuaG9tZXBhZ2UgPSAne3twYWNrYWdlLWhvbWVwYWdlfX0nO1xuXHRleHBvcnRzLnZlcnNpb24gPSAne3twYWNrYWdlLXZlcnNpb259fSc7XG59IGVsc2Uge1xuXHR2YXIgcGFja2FnZUluZm9Nb2R1bGVOYW1lID0gJy4uL3BhY2thZ2UuanNvbic7XG5cdHZhciBwYWNrYWdlSW5mbyA9IHJlcXVpcmUocGFja2FnZUluZm9Nb2R1bGVOYW1lKTtcblx0ZXhwb3J0cy5ob21lcGFnZSA9IHBhY2thZ2VJbmZvLmhvbWVwYWdlO1xuXHRleHBvcnRzLnZlcnNpb24gPSBwYWNrYWdlSW5mby52ZXJzaW9uO1xuXG5cdHZhciBmb3JtYXR0ZXJNb2R1bGVOYW1lID0gJy4vZm9ybWF0dGVycyc7XG5cdHZhciBmb3JtYXR0ZXJzID0gcmVxdWlyZShmb3JtYXR0ZXJNb2R1bGVOYW1lKTtcblx0ZXhwb3J0cy5mb3JtYXR0ZXJzID0gZm9ybWF0dGVycztcblx0Ly8gc2hvcnRjdXQgZm9yIGNvbnNvbGVcblx0ZXhwb3J0cy5jb25zb2xlID0gZm9ybWF0dGVycy5jb25zb2xlO1xufVxuIiwidmFyIFBpcGUgPSBmdW5jdGlvbiBQaXBlKG5hbWUpIHtcbiAgdGhpcy5uYW1lID0gbmFtZTtcbiAgdGhpcy5maWx0ZXJzID0gW107XG59O1xuXG5QaXBlLnByb3RvdHlwZS5wcm9jZXNzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgaWYgKCF0aGlzLnByb2Nlc3Nvcikge1xuICAgIHRocm93IG5ldyBFcnJvcignYWRkIHRoaXMgcGlwZSB0byBhIHByb2Nlc3NvciBiZWZvcmUgdXNpbmcgaXQnKTtcbiAgfVxuICB2YXIgZGVidWcgPSB0aGlzLmRlYnVnO1xuICB2YXIgbGVuZ3RoID0gdGhpcy5maWx0ZXJzLmxlbmd0aDtcbiAgdmFyIGNvbnRleHQgPSBpbnB1dDtcbiAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgIHZhciBmaWx0ZXIgPSB0aGlzLmZpbHRlcnNbaW5kZXhdO1xuICAgIGlmIChkZWJ1Zykge1xuICAgICAgdGhpcy5sb2coJ2ZpbHRlcjogJyArIGZpbHRlci5maWx0ZXJOYW1lKTtcbiAgICB9XG4gICAgZmlsdGVyKGNvbnRleHQpO1xuICAgIGlmICh0eXBlb2YgY29udGV4dCA9PT0gJ29iamVjdCcgJiYgY29udGV4dC5leGl0aW5nKSB7XG4gICAgICBjb250ZXh0LmV4aXRpbmcgPSBmYWxzZTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICBpZiAoIWNvbnRleHQubmV4dCAmJiB0aGlzLnJlc3VsdENoZWNrKSB7XG4gICAgdGhpcy5yZXN1bHRDaGVjayhjb250ZXh0KTtcbiAgfVxufTtcblxuUGlwZS5wcm90b3R5cGUubG9nID0gZnVuY3Rpb24obXNnKSB7XG4gIGNvbnNvbGUubG9nKCdbanNvbmRpZmZwYXRjaF0gJyArIHRoaXMubmFtZSArICcgcGlwZSwgJyArIG1zZyk7XG59O1xuXG5QaXBlLnByb3RvdHlwZS5hcHBlbmQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5maWx0ZXJzLnB1c2guYXBwbHkodGhpcy5maWx0ZXJzLCBhcmd1bWVudHMpO1xuICByZXR1cm4gdGhpcztcbn07XG5cblBpcGUucHJvdG90eXBlLnByZXBlbmQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5maWx0ZXJzLnVuc2hpZnQuYXBwbHkodGhpcy5maWx0ZXJzLCBhcmd1bWVudHMpO1xuICByZXR1cm4gdGhpcztcbn07XG5cblBpcGUucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbihmaWx0ZXJOYW1lKSB7XG4gIGlmICghZmlsdGVyTmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcignYSBmaWx0ZXIgbmFtZSBpcyByZXF1aXJlZCcpO1xuICB9XG4gIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCB0aGlzLmZpbHRlcnMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgdmFyIGZpbHRlciA9IHRoaXMuZmlsdGVyc1tpbmRleF07XG4gICAgaWYgKGZpbHRlci5maWx0ZXJOYW1lID09PSBmaWx0ZXJOYW1lKSB7XG4gICAgICByZXR1cm4gaW5kZXg7XG4gICAgfVxuICB9XG4gIHRocm93IG5ldyBFcnJvcignZmlsdGVyIG5vdCBmb3VuZDogJyArIGZpbHRlck5hbWUpO1xufTtcblxuUGlwZS5wcm90b3R5cGUubGlzdCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbmFtZXMgPSBbXTtcbiAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IHRoaXMuZmlsdGVycy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICB2YXIgZmlsdGVyID0gdGhpcy5maWx0ZXJzW2luZGV4XTtcbiAgICBuYW1lcy5wdXNoKGZpbHRlci5maWx0ZXJOYW1lKTtcbiAgfVxuICByZXR1cm4gbmFtZXM7XG59O1xuXG5QaXBlLnByb3RvdHlwZS5hZnRlciA9IGZ1bmN0aW9uKGZpbHRlck5hbWUpIHtcbiAgdmFyIGluZGV4ID0gdGhpcy5pbmRleE9mKGZpbHRlck5hbWUpO1xuICB2YXIgcGFyYW1zID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgaWYgKCFwYXJhbXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdhIGZpbHRlciBpcyByZXF1aXJlZCcpO1xuICB9XG4gIHBhcmFtcy51bnNoaWZ0KGluZGV4ICsgMSwgMCk7XG4gIEFycmF5LnByb3RvdHlwZS5zcGxpY2UuYXBwbHkodGhpcy5maWx0ZXJzLCBwYXJhbXMpO1xuICByZXR1cm4gdGhpcztcbn07XG5cblBpcGUucHJvdG90eXBlLmJlZm9yZSA9IGZ1bmN0aW9uKGZpbHRlck5hbWUpIHtcbiAgdmFyIGluZGV4ID0gdGhpcy5pbmRleE9mKGZpbHRlck5hbWUpO1xuICB2YXIgcGFyYW1zID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgaWYgKCFwYXJhbXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdhIGZpbHRlciBpcyByZXF1aXJlZCcpO1xuICB9XG4gIHBhcmFtcy51bnNoaWZ0KGluZGV4LCAwKTtcbiAgQXJyYXkucHJvdG90eXBlLnNwbGljZS5hcHBseSh0aGlzLmZpbHRlcnMsIHBhcmFtcyk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuUGlwZS5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5maWx0ZXJzLmxlbmd0aCA9IDA7XG4gIHJldHVybiB0aGlzO1xufTtcblxuUGlwZS5wcm90b3R5cGUuc2hvdWxkSGF2ZVJlc3VsdCA9IGZ1bmN0aW9uKHNob3VsZCkge1xuICBpZiAoc2hvdWxkID09PSBmYWxzZSkge1xuICAgIHRoaXMucmVzdWx0Q2hlY2sgPSBudWxsO1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAodGhpcy5yZXN1bHRDaGVjaykge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgcGlwZSA9IHRoaXM7XG4gIHRoaXMucmVzdWx0Q2hlY2sgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gICAgaWYgKCFjb250ZXh0Lmhhc1Jlc3VsdCkge1xuICAgICAgY29uc29sZS5sb2coY29udGV4dCk7XG4gICAgICB2YXIgZXJyb3IgPSBuZXcgRXJyb3IocGlwZS5uYW1lICsgJyBmYWlsZWQnKTtcbiAgICAgIGVycm9yLm5vUmVzdWx0ID0gdHJ1ZTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5leHBvcnRzLlBpcGUgPSBQaXBlO1xuIiwiXG52YXIgUHJvY2Vzc29yID0gZnVuY3Rpb24gUHJvY2Vzc29yKG9wdGlvbnMpe1xuXHR0aGlzLnNlbGZPcHRpb25zID0gb3B0aW9ucztcblx0dGhpcy5waXBlcyA9IHt9O1xufTtcblxuUHJvY2Vzc29yLnByb3RvdHlwZS5vcHRpb25zID0gZnVuY3Rpb24ob3B0aW9ucykge1xuXHRpZiAob3B0aW9ucykge1xuXHRcdHRoaXMuc2VsZk9wdGlvbnMgPSBvcHRpb25zO1xuXHR9XG5cdHJldHVybiB0aGlzLnNlbGZPcHRpb25zO1xufTtcblxuUHJvY2Vzc29yLnByb3RvdHlwZS5waXBlID0gZnVuY3Rpb24obmFtZSwgcGlwZSkge1xuXHRpZiAodHlwZW9mIG5hbWUgPT09ICdzdHJpbmcnKSB7XG5cdFx0aWYgKHR5cGVvZiBwaXBlID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0cmV0dXJuIHRoaXMucGlwZXNbbmFtZV07XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMucGlwZXNbbmFtZV0gPSBwaXBlO1xuXHRcdH1cblx0fVxuXHRpZiAobmFtZSAmJiBuYW1lLm5hbWUpIHtcblx0XHRwaXBlID0gbmFtZTtcblx0XHRpZiAocGlwZS5wcm9jZXNzb3IgPT09IHRoaXMpIHsgcmV0dXJuIHBpcGU7IH1cblx0XHR0aGlzLnBpcGVzW3BpcGUubmFtZV0gPSBwaXBlO1xuXHR9XG5cdHBpcGUucHJvY2Vzc29yID0gdGhpcztcblx0cmV0dXJuIHBpcGU7XG59O1xuXG5Qcm9jZXNzb3IucHJvdG90eXBlLnByb2Nlc3MgPSBmdW5jdGlvbihpbnB1dCwgcGlwZSkge1xuXHR2YXIgY29udGV4dCA9IGlucHV0O1xuXHRjb250ZXh0Lm9wdGlvbnMgPSB0aGlzLm9wdGlvbnMoKTtcblx0dmFyIG5leHRQaXBlID0gcGlwZSB8fCBpbnB1dC5waXBlIHx8ICdkZWZhdWx0Jztcblx0dmFyIGxhc3RQaXBlLCBsYXN0Q29udGV4dDtcblx0d2hpbGUgKG5leHRQaXBlKSB7XG5cdFx0aWYgKHR5cGVvZiBjb250ZXh0Lm5leHRBZnRlckNoaWxkcmVuICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0Ly8gY2hpbGRyZW4gcHJvY2Vzc2VkIGFuZCBjb21pbmcgYmFjayB0byBwYXJlbnRcblx0XHRcdGNvbnRleHQubmV4dCA9IGNvbnRleHQubmV4dEFmdGVyQ2hpbGRyZW47XG5cdFx0XHRjb250ZXh0Lm5leHRBZnRlckNoaWxkcmVuID0gbnVsbDtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIG5leHRQaXBlID09PSAnc3RyaW5nJykge1xuXHRcdFx0bmV4dFBpcGUgPSB0aGlzLnBpcGUobmV4dFBpcGUpO1xuXHRcdH1cblx0XHRuZXh0UGlwZS5wcm9jZXNzKGNvbnRleHQpO1xuXHRcdGxhc3RDb250ZXh0ID0gY29udGV4dDtcblx0XHRsYXN0UGlwZSA9IG5leHRQaXBlO1xuXHRcdG5leHRQaXBlID0gbnVsbDtcblx0XHRpZiAoY29udGV4dCkge1xuXHRcdFx0aWYgKGNvbnRleHQubmV4dCkge1xuXHRcdFx0XHRjb250ZXh0ID0gY29udGV4dC5uZXh0O1xuXHRcdFx0XHRuZXh0UGlwZSA9IGxhc3RDb250ZXh0Lm5leHRQaXBlIHx8IGNvbnRleHQucGlwZSB8fCBsYXN0UGlwZTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblx0cmV0dXJuIGNvbnRleHQuaGFzUmVzdWx0ID8gY29udGV4dC5yZXN1bHQgOiB1bmRlZmluZWQ7XG59O1xuXG5leHBvcnRzLlByb2Nlc3NvciA9IFByb2Nlc3NvcjtcbiIsInZhciBqc29uZGlmZnBhdGNoID0gcmVxdWlyZSgnanNvbmRpZmZwYXRjaCcpO1xuXG5mdW5jdGlvbiBEb2Mocm9vdCwgdmVyc2lvbikge1xuICB0aGlzLnJvb3QgPSB0eXBlb2Ygcm9vdCA9PT0gJ3VuZGVmaW5lZCcgPyBudWxsIDogcm9vdDtcbiAgdGhpcy52ZXJzaW9uID0gdmVyc2lvbiB8fCAwO1xufVxuXG5Eb2MucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gKCkge1xuICB2YXIgZG9jID0gbmV3IERvYyhcbiAgICBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHRoaXMucm9vdCksIGpzb25kaWZmcGF0Y2guZGF0ZVJldml2ZXIpLFxuICAgIHRoaXMudmVyc2lvblxuICApO1xuICBkb2MudXJsID0gdGhpcy51cmw7XG4gIHJldHVybiBkb2M7XG59O1xuXG5Eb2MuZW1wdHkgPSBuZXcgRG9jKG51bGwsIDApO1xuRG9jLmVtcHR5LmlzRW1wdHkgPSB0cnVlO1xuXG5Eb2Mubm90Rm91bmQgPSBuZXcgRG9jKG51bGwsIDApO1xuRG9jLm5vdEZvdW5kLm5vdEZvdW5kID0gdHJ1ZTtcblxuZXhwb3J0cy5Eb2MgPSBEb2M7XG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcbnZhciBldmVudHMgPSByZXF1aXJlKCdldmVudHMnKTtcbnZhciBqc29uZGlmZnBhdGNoID0gcmVxdWlyZSgnanNvbmRpZmZwYXRjaCcpO1xudmFyIGpzb25kaWZmcGF0Y2ggPSByZXF1aXJlKCdqc29uZGlmZnBhdGNoJyk7XG5pZiAocHJvY2Vzcy5icm93c2VyKSB7XG4gIC8qIGpzaGludCBpZ25vcmU6IHN0YXJ0ICovXG4gIHdpbmRvdy5kaWZmX21hdGNoX3BhdGNoID0gd2luZG93LmRpZmZfbWF0Y2hfcGF0Y2ggfHwgcmVxdWlyZSgnanNvbmRpZmZwYXRjaC9wdWJsaWMvZXh0ZXJuYWwvZGlmZl9tYXRjaF9wYXRjaF91bmNvbXByZXNzZWQnKTtcbiAgLyoganNoaW50IGlnbm9yZTogZW5kICovXG59XG5cbnZhciBEb2MgPSByZXF1aXJlKCcuL2RvYycpLkRvYztcblxuZnVuY3Rpb24gUGVlcihuYW1lLCBkb2N1bWVudCl7XG4gIGV2ZW50cy5FdmVudEVtaXR0ZXIuY2FsbCh0aGlzKTtcbiAgaWYgKG5hbWUgaW5zdGFuY2VvZiBEb2MpIHtcbiAgICB0aGlzLmRvY3VtZW50ID0gbmFtZTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMuZG9jdW1lbnQgPSBkb2N1bWVudCB8fCBEb2MuZW1wdHk7XG4gIH1cbiAgdGhpcy5jb3VudGVycyA9IHtcbiAgICBtZXNzYWdlczoge1xuICAgICAgc2VudDogMCxcbiAgICAgIHJlY2VpdmVkOiAwXG4gICAgfVxuICB9O1xuICB0aGlzLmNyZWF0ZVNoYWRvdygpO1xuICB0aGlzLndhdGNoSW50ZXJ2YWwgPSBQZWVyLmRlZmF1bHRzLndhdGNoSW50ZXJ2YWw7XG4gIHRoaXMuZGVidWcgPSBQZWVyLmRlZmF1bHRzLmRlYnVnO1xufVxudXRpbC5pbmhlcml0cyhQZWVyLCBldmVudHMuRXZlbnRFbWl0dGVyKTtcblxuUGVlci5kZWZhdWx0cyA9IHtcbiAgd2F0Y2hJbnRlcnZhbDogMTAwLFxuICBkZWJ1ZzogZmFsc2Vcbn07XG5cblBlZXIucHJvdG90eXBlLmxvZyA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5kZWJ1Zykge1xuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmFwcGx5KGFyZ3VtZW50cyk7XG4gICAgYXJncy51bnNoaWZ0KCdbUGVlciAnICsgdGhpcy5uYW1lICsgJ10nKTtcbiAgICBjb25zb2xlLmxvZy5hcHBseShjb25zb2xlLCBhcmdzKTtcbiAgfVxufTtcblxuUGVlci5wcm90b3R5cGUuc3luY0Jyb2tlbiA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKCF0aGlzLnN5bmNocm9uaXplZCkge1xuICAgIHJldHVybjtcbiAgfVxuICB0aGlzLnN5bmNocm9uaXplZCA9IGZhbHNlO1xuICB0aGlzLmVtaXQoJ3Vuc3luYycpO1xuICB0aGlzLnN0b3AoKTtcbn07XG5cblBlZXIucHJvdG90eXBlLnN5bmNDb21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHRoaXMuc3luY2hyb25pemVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRoaXMuc3luY2hyb25pemVkID0gdHJ1ZTtcbiAgdGhpcy5sb2coJ3N5bmMgY29tcGxldGUnKTtcbiAgdGhpcy53YXRjaCgpO1xuICB0aGlzLmVtaXQoJ3N5bmMnKTtcbn07XG5cblBlZXIucHJvdG90eXBlLnVzZSA9IGZ1bmN0aW9uKGRvYykge1xuICB0aGlzLmxvZygnZG9jdW1lbnQgbG9hZGVkIGxvY2FsbHk6JywgZG9jLnVybCk7XG4gIHRoaXMuZG9jdW1lbnQgPSBkb2M7XG4gIHRoaXMuY3JlYXRlU2hhZG93KCk7XG4gIHRoaXMuZW1pdCgnbG9hZGVkJyk7XG4gIHZhciByZXEgPSB0aGlzLmRvY3VtZW50UmVxdWVzdDtcbiAgaWYgKHJlcSkge1xuICAgIHRoaXMuZG9jdW1lbnRSZXF1ZXN0ID0gbnVsbDtcbiAgICBpZiAocmVxLmNhbGxiYWNrKSB7XG4gICAgICByZXEuY2FsbGJhY2soKTtcbiAgICB9XG4gIH1cbiAgdGhpcy5zeW5jQ29tcGxldGUoKTtcbn07XG5cblBlZXIucHJvdG90eXBlLmxvYWQgPSBmdW5jdGlvbih1cmwsIG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gIHZhciBvcHQgPSBvcHRpb25zIHx8IHt9O1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNhbGxiYWNrID0gb3B0aW9ucztcbiAgICBvcHQgPSB7fTtcbiAgfVxuICB0aGlzLmRvY3VtZW50UmVxdWVzdCA9IHtcbiAgICB1cmw6IHVybCxcbiAgICBvcHRpb25zOiBvcHQsXG4gICAgY2FsbGJhY2s6IGNhbGxiYWNrXG4gIH07XG4gIGlmIChvcHQgJiYgb3B0LmxvY2FsKSB7XG4gICAgdGhpcy5lbWl0KCdsb2FkJywgdXJsLCBjYWxsYmFjayk7XG4gICAgaWYgKCF0aGlzLmxvYWRpbmcpIHtcbiAgICAgIGlmICh0aGlzLnN0b3JhZ2UpIHtcbiAgICAgICAgdGhpcy5sb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5zdG9yYWdlLmdldCh1cmwsIG9wdCwgZnVuY3Rpb24oZXJyLCBkb2MpIHtcbiAgICAgICAgICBzZWxmLmxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzZWxmLnVzZShkb2MpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5sb2coJ25vIGRvY3VtZW50IGxvYWRlciBmb3InLCB1cmwpO1xuICAgICAgY2FsbGJhY2sobmV3IEVycm9yKCdubyBkb2N1bWVudCBsb2FkZXInKSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRoaXMuc2NhbigpO1xuICB9XG59O1xuXG5QZWVyLnByb3RvdHlwZS5zYXZlID0gZnVuY3Rpb24odXJsLCBvcHRpb25zLCBjYWxsYmFjaykge1xuICB2YXIgb3B0ID0gb3B0aW9ucyB8fCB7fTtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICBjYWxsYmFjayA9IG9wdGlvbnM7XG4gICAgb3B0ID0ge307XG4gIH1cbiAgdGhpcy5zYXZlUmVxdWVzdCA9IHtcbiAgICB1cmw6IHVybCxcbiAgICBvcHRpb25zOiBvcHQsXG4gICAgY2FsbGJhY2s6IGNhbGxiYWNrXG4gIH07XG4gIHRoaXMuZW1pdCgnc2F2ZScsIHVybCwgY2FsbGJhY2spO1xuICBpZiAoIXRoaXMuc2F2aW5nKSB7XG4gICAgaWYgKHRoaXMuc3RvcmFnZSkge1xuICAgICAgdGhpcy5zYXZpbmcgPSB0cnVlO1xuICAgICAgdGhpcy5zdG9yYWdlLnB1dCh1cmwsIHRoaXMuZG9jdW1lbnQsIG9wdGlvbnMsIGZ1bmN0aW9uKGVyciwgdXJsKSB7XG4gICAgICAgIHNlbGYuc2F2aW5nID0gZmFsc2U7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBzZWxmLmRvY3VtZW50LnVybCA9IHVybDtcbiAgICAgICAgc2VsZi5zYXZlZCgpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMubG9nKCdubyBkb2N1bWVudCBzYXZlciBmb3InLCB1cmwpO1xuICAgIGNhbGxiYWNrKG5ldyBFcnJvcignbm8gZG9jdW1lbnQgc2F2ZXInKSk7XG4gIH1cbn07XG5cblBlZXIucHJvdG90eXBlLnNhdmVkID0gZnVuY3Rpb24oKSB7XG4gIHZhciBkb2MgPSB0aGlzLmRvY3VtZW50O1xuICB0aGlzLmxvZygnZG9jdW1lbnQgc2F2ZWQgbG9jYWxseTonLCBkb2MudXJsKTtcbiAgdmFyIHJlcSA9IHRoaXMuc2F2ZVJlcXVlc3Q7XG4gIGlmIChyZXEpIHtcbiAgICB0aGlzLnNhdmVSZXF1ZXN0ID0gbnVsbDtcbiAgICBpZiAocmVxLmNhbGxiYWNrKSB7XG4gICAgICByZXEuY2FsbGJhY2soKTtcbiAgICB9XG4gIH1cbn07XG5cblBlZXIucHJvdG90eXBlLmNyZWF0ZVNoYWRvdyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnNoYWRvdyA9IHRoaXMuZG9jdW1lbnQuY2xvbmUoKTtcbn07XG5cblBlZXIucHJvdG90eXBlLnNlbmQgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gIHRoaXMuY291bnRlcnMubWVzc2FnZXMuc2VudCsrO1xuICB0aGlzLmVtaXQoJ21lc3NhZ2UnLCBtZXNzYWdlKTtcbiAgdGhpcy5sYXN0U2VudCA9IG1lc3NhZ2U7XG4gIHRoaXMud2FpdGluZ1Jlc3BvbnNlID0gdHJ1ZTtcbn07XG5cblBlZXIucHJvdG90eXBlLnJlY2VpdmUgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdGhpcy53YWl0aW5nUmVzcG9uc2UgPSBmYWxzZTtcbiAgdGhpcy5yZXNwb25kaW5nID0gdHJ1ZTtcbiAgdGhpcy5jb3VudGVycy5tZXNzYWdlcy5yZWNlaXZlZCsrO1xuICBtZXNzYWdlLnJlc3BvbnNlVG8gPSB0aGlzLmxhc3RTZW50O1xuICB0aGlzLnJlc3BvbmQobWVzc2FnZSwgZnVuY3Rpb24oZXJyLCByZXNwb25zZSl7XG4gICAgaWYgKGVycikge1xuICAgICAgc2VsZi5zZW5kKHsgZXJyb3I6IGVyciB9KTtcbiAgICAgIHNlbGYucmVzcG9uZGluZyA9IGZhbHNlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAocmVzcG9uc2UpIHtcbiAgICAgIHNlbGYuc2VuZChyZXNwb25zZSk7XG4gICAgfVxuICAgIHNlbGYucmVzcG9uZGluZyA9IGZhbHNlO1xuICB9KTtcbn07XG5cblBlZXIucHJvdG90eXBlLmlzQnVzeSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMud2FpdGluZ1Jlc3BvbnNlIHx8IHRoaXMucmVzcG9uZGluZztcbn07XG5cblBlZXIucHJvdG90eXBlLnNjYW4gPSBmdW5jdGlvbigpe1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIGlmICh0aGlzLnJlc3BvbmRpbmcpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAoIXRoaXMud2FpdGluZ1Jlc3BvbnNlICYmIHRoaXMuZG9jdW1lbnRSZXF1ZXN0KSB7XG4gICAgaWYgKCF0aGlzLmRvY3VtZW50UmVxdWVzdC5vcHRpb25zLmxvY2FsICYmICF0aGlzLmRvY3VtZW50UmVxdWVzdC5zZW50KSB7XG4gICAgICB0aGlzLmxvZygncmVxdWVzdGluZyBkb2N1bWVudCcsIHRoaXMuZG9jdW1lbnRSZXF1ZXN0LnVybCk7XG4gICAgICB0aGlzLnNlbmQoe1xuICAgICAgICBsb2FkOiB0cnVlLFxuICAgICAgICB1cmw6IHRoaXMuZG9jdW1lbnRSZXF1ZXN0LnVybCxcbiAgICAgICAgb3B0aW9uczogdGhpcy5kb2N1bWVudFJlcXVlc3Qub3B0aW9uc1xuICAgICAgfSk7XG4gICAgICB0aGlzLmRvY3VtZW50UmVxdWVzdC5zZW50ID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKCF0aGlzLndhaXRpbmdSZXNwb25zZSAmJiB0aGlzLnNhdmVSZXF1ZXN0KSB7XG4gICAgaWYgKCF0aGlzLnNhdmVSZXF1ZXN0Lm9wdGlvbnMubG9jYWwgJiYgIXRoaXMuc2F2ZVJlcXVlc3Quc2VudCkge1xuICAgICAgdGhpcy5sb2coJ3JlcXVlc3RpbmcgdG8gc2F2ZSBkb2N1bWVudCBhcycsIHRoaXMuc2F2ZVJlcXVlc3QudXJsKTtcbiAgICAgIHRoaXMuc2VuZCh7XG4gICAgICAgIHNhdmU6IHRydWUsXG4gICAgICAgIHVybDogdGhpcy5zYXZlUmVxdWVzdC51cmwsXG4gICAgICAgIG9wdGlvbnM6IHRoaXMuc2F2ZVJlcXVlc3Qub3B0aW9uc1xuICAgICAgfSk7XG4gICAgICB0aGlzLnNhdmVSZXF1ZXN0LnNlbnQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm47XG4gIH1cblxuICB0aGlzLmdldENoYW5nZXMoZnVuY3Rpb24oZGVsdGEpIHtcbiAgICBpZiAoIWRlbHRhKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHNlbGYuc3luY0Jyb2tlbigpO1xuICAgIGlmIChzZWxmLmlzQnVzeSgpKSB7XG4gICAgICBzZWxmLmxvZygncGluZycpO1xuICAgICAgc2VsZi5zZW5kKHsgcGluZzogdHJ1ZSB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc2VsZi5kb2N1bWVudC52ZXJzaW9uKys7XG4gICAgc2VsZi5jcmVhdGVTaGFkb3coKTtcbiAgICBzZWxmLnNlbmQoe1xuICAgICAgZGVsdGE6IGRlbHRhLFxuICAgICAgdmVyc2lvbjogc2VsZi5kb2N1bWVudC52ZXJzaW9uXG4gICAgfSk7XG4gIH0pO1xufTtcblxuUGVlci5wcm90b3R5cGUud2F0Y2ggPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLndhdGNoVGltZXIpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLndhdGNoVGltZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpe1xuICAgIGlmIChzZWxmLmlzUGF1c2VkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHNlbGYuc2Nhbih7IHNvdXJjZTogJ3dhdGNoJyB9KTtcbiAgfSwgTWF0aC5tYXgoMjAsIHNlbGYud2F0Y2hJbnRlcnZhbCkpO1xuICB0aGlzLmxvZygnd2F0Y2hpbmcuLi4nKTtcbn07XG5cblBlZXIucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICghdGhpcy53YXRjaFRpbWVyKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNsZWFySW50ZXJ2YWwodGhpcy53YXRjaFRpbWVyKTtcbiAgdGhpcy53YXRjaFRpbWVyID0gbnVsbDtcbiAgdGhpcy5sb2coJ3dhdGNoIHN0b3BwZWQnKTtcbn07XG5cblBlZXIucHJvdG90eXBlLnBhdXNlID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5pc1BhdXNlZCkge1xuICAgIHJldHVybjtcbiAgfVxuICB0aGlzLmlzUGF1c2VkID0gdHJ1ZTtcbiAgdGhpcy5lbWl0KCdwYXVzZScpO1xufTtcblxuUGVlci5wcm90b3R5cGUucmVzdW1lID0gZnVuY3Rpb24gKCkge1xuICBpZiAoIXRoaXMuaXNQYXVzZWQpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdGhpcy5pc1BhdXNlZCA9IGZhbHNlO1xuICB0aGlzLmVtaXQoJ3Jlc3VtZScpO1xufTtcblxuUGVlci5wcm90b3R5cGUuZ2V0Q2hhbmdlcyA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAvLyB1c2UganNvbmRpZmZwYXRjaCB0byBkZXRlY3QgY2hhbmdlcyBpbiBkb2N1bWVudFxuICB2YXIgZGVsdGEgPSBqc29uZGlmZnBhdGNoLmRpZmYodGhpcy5zaGFkb3cucm9vdCwgdGhpcy5kb2N1bWVudC5yb290KTtcbiAgaWYgKGRlbHRhKSB7XG4gICAgdGhpcy5sb2coJ2ZvdW5kIGNoYW5nZXMnLCBkZWx0YSk7XG4gIH1cbiAgY2FsbGJhY2soZGVsdGEpO1xufTtcblxuUGVlci5wcm90b3R5cGUucmVzcG9uZCA9IGZ1bmN0aW9uKG1lc3NhZ2UsIGNhbGxiYWNrKSB7XG4gIHRoaXMucGVlckVycm9yID0gbnVsbDtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB2YXIgc2VuZE5vb3AgPSBmdW5jdGlvbigpe1xuICAgIGNhbGxiYWNrKG51bGwsIHsgbm9vcDogdHJ1ZSB9KTtcbiAgfTtcblxuICB2YXIgcmVxO1xuXG4gIC8vIHJlc3BvbmQgdG8gcGVlciBlcnJvclxuICBpZiAobWVzc2FnZS5lcnJvcikge1xuICAgIHRoaXMubG9nKCdnb3QgcGVlciBlcnJvcjogJyArIG1lc3NhZ2UuZXJyb3IpO1xuICAgIHRoaXMucGVlckVycm9yID0gbWVzc2FnZS5lcnJvcjtcbiAgICBjYWxsYmFjaygpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIHJlc3BvbmQgdG8gYSBkZWx0YVxuICBpZiAobWVzc2FnZS5kZWx0YSkge1xuICAgIHRoaXMubG9nKCdwYXRjaGluZy4uLicpO1xuICAgIHRyeSB7XG4gICAgICAvLyBleGFjdCBwYXRjaFxuICAgICAgdGhpcy5zaGFkb3cucm9vdCA9IGpzb25kaWZmcGF0Y2gucGF0Y2godGhpcy5zaGFkb3cucm9vdCwgbWVzc2FnZS5kZWx0YSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAvLyBvdXQtb2Ytc3luYyBUT0RPOiByZWxvYWQgdGhlIGZ1bGwgZG9jXG4gICAgICB0aGlzLmxvZygncGF0Y2ggZXJyb3I6ICcsIGVycik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAvLyBiZXN0LWVmZm9ydCBwYXRjaFxuICAgICAgdGhpcy5kb2N1bWVudC5yb290ID0ganNvbmRpZmZwYXRjaC5wYXRjaCh0aGlzLmRvY3VtZW50LnJvb3QsIG1lc3NhZ2UuZGVsdGEpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgdGhpcy5sb2coJ3BhdGNoIGVycm9yIChiZXN0LWVmZm9ydCk6ICcsIGVycik7XG4gICAgfVxuICAgIGlmIChtZXNzYWdlLnZlcnNpb24gJiYgdGhpcy5kb2N1bWVudC52ZXJzaW9uIDw9IG1lc3NhZ2UudmVyc2lvbikge1xuICAgICAgdGhpcy5kb2N1bWVudC52ZXJzaW9uID0gbWVzc2FnZS52ZXJzaW9uO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRvY3VtZW50LnZlcnNpb24rKztcbiAgICB9XG4gICAgdGhpcy5sb2coJ3Jlc3VsdDonLCB0aGlzLmRvY3VtZW50KTtcbiAgICB0aGlzLmVtaXQoJ2NoYW5nZScpO1xuICB9XG5cbiAgLy8gcmVzcG9uZCB0byBub29wIChwZWVyIGhhcyBubyBjaGFuZ2VzKVxuICBpZiAobWVzc2FnZS5ub29wKSB7XG4gICAgdGhpcy5sb2coJ2dvdCBub29wJyk7XG4gICAgLy8gbm8gY2hhbmdlcyBvbiB0aGUgb3RoZXIgcGVlclxuICAgIGlmICgobWVzc2FnZS5yZXNwb25zZVRvICYmIG1lc3NhZ2UucmVzcG9uc2VUby5ub29wKSAmJiAhdGhpcy5hbHdheXNSZXNwb25kTm9vcHMpIHtcbiAgICAgIHRoaXMuc3luY0NvbXBsZXRlKCk7XG4gICAgICBjYWxsYmFjaygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuXG4gIC8vIHJlc3BvbmQgdG8gcGluZyAocGVlciB3YW50cyB0byBzZW5kIGEgbWVzc2FnZSwgYnV0IGlzIHdhaXRpbmcgZm9yIHJlc3BvbnNlKVxuICBpZiAobWVzc2FnZS5waW5nKSB7XG4gICAgdGhpcy5sb2coJ2dvdCBwaW5nJyk7XG4gICAgaWYgKHRoaXMud2FpdGluZ1Jlc3BvbnNlKSB7XG4gICAgICB0aGlzLmxvZygnaWdub3JpbmcgcGluZywgd2FpdGluZyBhIHJlc3BvbnNlJyk7XG4gICAgICBjYWxsYmFjaygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuXG4gIC8vIHJlc3BvbmQgdG8gdGhpcyBtZXNzYWdlcyBzZW5kaW5nIGNoYW5nZXMgKGlmIGFueSlcbiAgaWYgKG1lc3NhZ2Uubm9vcCB8fCBtZXNzYWdlLmRlbHRhIHx8IG1lc3NhZ2UucGluZyB8fCBtZXNzYWdlLnNhdmVkKSB7XG4gICAgdGhpcy5nZXRDaGFuZ2VzKGZ1bmN0aW9uKGRlbHRhKSB7XG4gICAgICBpZiAoIWRlbHRhKSB7XG4gICAgICAgIGlmIChtZXNzYWdlLm5vb3ApIHtcbiAgICAgICAgICBzZWxmLnN5bmNDb21wbGV0ZSgpO1xuICAgICAgICB9XG4gICAgICAgIHNlbmROb29wKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHNlbGYuZG9jdW1lbnQudmVyc2lvbisrO1xuICAgICAgc2VsZi5jcmVhdGVTaGFkb3coKTtcbiAgICAgIGNhbGxiYWNrKG51bGwsIHtcbiAgICAgICAgZGVsdGE6IGRlbHRhLFxuICAgICAgICB2ZXJzaW9uOiBzZWxmLmRvY3VtZW50LnZlcnNpb25cbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIHJlc3BvbmQgdG8gZG9jdW1lbnQgbG9hZCByZXF1ZXN0XG4gIGlmIChtZXNzYWdlLmxvYWQpIHtcbiAgICAvLyBwZWVyIHdhbnRzIHRvIGxvYWQgYSBmdWxsIGRvY3VtZW50XG4gICAgdGhpcy5sb2coJ2dvdCBkb2N1bWVudCBsb2FkIHJlcXVlc3QnKTtcbiAgICB2YXIgdXJsID0gbWVzc2FnZS51cmw7XG4gICAgdmFyIHNlbmREb2MgPSBmdW5jdGlvbigpe1xuICAgICAgdmFyIGRvYyA9IHNlbGYuZG9jdW1lbnQuY2xvbmUoKTtcbiAgICAgIHNlbGYud2F0Y2goKTtcbiAgICAgIGNhbGxiYWNrKG51bGwsIHtcbiAgICAgICAgZG9jdW1lbnQ6IHtcbiAgICAgICAgICByb290OiBkb2Mucm9vdCxcbiAgICAgICAgICB1cmw6IGRvYy51cmwsXG4gICAgICAgICAgdmVyc2lvbjogZG9jLnZlcnNpb25cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcbiAgICBpZiAodGhpcy5kb2N1bWVudC5pc0VtcHR5IHx8ICh1cmwgJiYgdGhpcy5kb2N1bWVudC51cmwgIT09IHVybCkpIHtcbiAgICAgIHRoaXMubG9nKCdsb2FkaW5nJywgdXJsKTtcbiAgICAgIHZhciBsb2FkT3B0aW9ucyA9IG1lc3NhZ2Uub3B0aW9ucyB8fCB7fTtcbiAgICAgIGxvYWRPcHRpb25zLmxvY2FsID0gdHJ1ZTtcbiAgICAgIHRoaXMubG9hZCh1cmwsIGxvYWRPcHRpb25zLCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHNlbGYubG9nKCdlcnJvciBsb2FkaW5nIGRvY3VtZW50Jyk7XG4gICAgICAgICAgY2FsbGJhY2sobnVsbCwge1xuICAgICAgICAgICAgZXJyb3I6IGVyci5tZXNzYWdlLFxuICAgICAgICAgICAgdXJsOiB1cmxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgc2VsZi5sb2coJ2RvY3VtZW50IGxvYWRlZCwgc2VuZGluZyB0byBwZWVyJywgc2VsZi5kb2N1bWVudCk7XG4gICAgICAgIHNlbmREb2MoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMubG9nKCdzZW5kaW5nIGRvY3VtZW50JywgdGhpcy5kb2N1bWVudCk7XG4gICAgc2VuZERvYygpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIHJlc3BvbmQgdG8gZnVsbCBkb2N1bWVudFxuICBpZiAobWVzc2FnZS5kb2N1bWVudCkge1xuICAgIC8vIHBlZXIgc2VudCB0aGUgZnVsbCBkb2N1bWVudFxuICAgIHJlcSA9IHRoaXMuZG9jdW1lbnRSZXF1ZXN0O1xuICAgIGlmIChyZXEgJiYgcmVxLnNlbnQpIHtcbiAgICAgIHRoaXMuZG9jdW1lbnRSZXF1ZXN0ID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKG1lc3NhZ2UuZXJyb3IpIHtcbiAgICAgIHRoaXMubG9nKCdkb2N1bWVudCBsb2FkIGVycm9yJyk7XG4gICAgICBjYWxsYmFjaygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmRvY3VtZW50ID0gbmV3IERvYyhtZXNzYWdlLmRvY3VtZW50LnJvb3QsIG1lc3NhZ2UuZG9jdW1lbnQudmVyc2lvbik7XG4gICAgdGhpcy5kb2N1bWVudC51cmwgPSBtZXNzYWdlLmRvY3VtZW50LnVybDtcbiAgICB0aGlzLmNyZWF0ZVNoYWRvdygpO1xuICAgIHRoaXMubG9nKCdnb3QgZG9jdW1lbnQnLCB0aGlzLmRvY3VtZW50KTtcbiAgICB0aGlzLmVtaXQoJ2xvYWRlZCcpO1xuICAgIHRoaXMuc3luY0NvbXBsZXRlKCk7XG4gICAgY2FsbGJhY2soKTtcbiAgICBpZiAocmVxICYmIHJlcS5jYWxsYmFjaykge1xuICAgICAgcmVxLmNhbGxiYWNrKCk7XG4gICAgfVxuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIHJlc3BvbmQgdG8gdW5leHBlY3RlZCBtZXNzYWdlXG4gIHRoaXMubG9nKCdlcnJvcicsICd1bmV4cGVjdGVkIG1lc3NhZ2UnLCBtZXNzYWdlKTtcbiAgY2FsbGJhY2sobmV3IEVycm9yKCd1bmV4cGVjdGVkIG1lc3NhZ2UnKSk7XG59O1xuXG5QZWVyLnByb3RvdHlwZS5iaW5kVG8gPSBmdW5jdGlvbiAocGVlciwgb3B0aW9ucykge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIGlmIChwZWVyICYmIHR5cGVvZiBwZWVyLm9uID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdmFyIGFydGlmaWNpYWxEZWxheSA9IE1hdGgubWF4KG9wdGlvbnMgJiYgb3B0aW9ucy5hcnRpZmljaWFsRGVsYXksIDEpO1xuICAgIHBlZXIub24oJ21lc3NhZ2UnLCBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIHNlbGYucmVjZWl2ZShtZXNzYWdlKTtcbiAgICAgIH0sIGFydGlmaWNpYWxEZWxheSk7XG4gICAgfSk7XG4gICAgdGhpcy5ib3VuZFRvID0gcGVlcjtcbiAgICBpZiAocGVlciBpbnN0YW5jZW9mIFBlZXIgJiYgIXBlZXIuYm91bmRUbykge1xuICAgICAgcGVlci5iaW5kVG8oc2VsZiwgb3B0aW9ucyk7XG4gICAgfVxuICAgIHJldHVybjtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoJ3Vuc3VwcG9ydGVkIGJpbmQgdGFyZ2V0Jyk7XG59O1xuXG5leHBvcnRzLlBlZXIgPSBQZWVyO1xuIiwiXG52YXIgRG9jID0gcmVxdWlyZSgnLi9kb2MnKS5Eb2M7XG5cbmZ1bmN0aW9uIFN0b3JhZ2UoZG9jdW1lbnRzKSB7XG4gIC8vIGJhc2UgaW1wbGVtZW50YXRpb24gaXMgaW4tbWVtb3J5XG4gIHRoaXMuZG9jdW1lbnRzID0gZG9jdW1lbnRzIHx8IHt9O1xufVxuXG5TdG9yYWdlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAodXJsLCBvcHRpb25zLCBjYWxsYmFjaykge1xuICBpZiAoIXRoaXMuZG9jdW1lbnRzIHx8ICF0aGlzLmRvY3VtZW50c1t1cmxdKSB7XG4gICAgaWYgKCFvcHRpb25zIHx8ICFvcHRpb25zLmNyZWF0ZSkge1xuICAgICAgdmFyIGVyciA9IG5ldyBFcnJvcignZG9jdW1lbnQgbm90IGZvdW5kJyk7XG4gICAgICBlcnIubm90Rm91bmQgPSB0cnVlO1xuICAgICAgZXJyLnVybCA9IHVybDtcbiAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuZG9jdW1lbnRzW3VybF0gPSB7fTtcbiAgfVxuICB2YXIgZG9jID0gdGhpcy5kb2N1bWVudHNbdXJsXTtcbiAgaWYgKCEoZG9jIGluc3RhbmNlb2YgRG9jKSkge1xuICAgIGRvYyA9IHRoaXMuZG9jdW1lbnRzW3VybF0gPSBuZXcgRG9jKGRvYyk7XG4gIH1cbiAgZG9jLnVybCA9IHVybDtcbiAgY2FsbGJhY2sobnVsbCwgZG9jKTtcbn07XG5cblN0b3JhZ2UucHJvdG90eXBlLnB1dCA9IGZ1bmN0aW9uICh1cmwsIGRvYywgb3B0aW9ucywgY2FsbGJhY2spIHtcbiAgaWYgKCF0aGlzLmRvY3VtZW50cykge1xuICAgIHRoaXMuZG9jdW1lbnRzID0ge307XG4gIH1cbiAgaWYgKCEoZG9jIGluc3RhbmNlb2YgRG9jKSkge1xuICAgIGRvYyA9IG5ldyBEb2MoZG9jKTtcbiAgfVxuICBkb2MudXJsID0gdXJsO1xuICB0aGlzLmRvY3VtZW50c1t1cmxdID0gZG9jLmNsb25lKCk7XG4gIGNhbGxiYWNrKG51bGwsIHVybCk7XG59O1xuXG5leHBvcnRzLlN0b3JhZ2UgPSBTdG9yYWdlO1xuIl19
