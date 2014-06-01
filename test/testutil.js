
var dialogo = (typeof window !== 'undefined') ? window.dialogo : require('../src/' + 'main.js');
var jsondiffpatch = dialogo.jsondiffpatch;

var isArray = (typeof Array.isArray === 'function') ?
    // use native function
    Array.isArray :
    // use instanceof operator
    function(a) {
        return typeof a === 'object' && a instanceof Array;
    };

exports.isArray = isArray;

var dateReviver = jsondiffpatch.dateReviver;

function deepEqual(obj1, obj2) {
    if (obj1 === obj2) {
        return true;
    }
    if (obj1 === null || obj2 === null) { return false; }
    if ((typeof obj1 === 'object') && (typeof obj2 === 'object')) {
        if (obj1 instanceof Date) {
            if (!(obj2 instanceof Date)) { return false; }
            return obj1.toString() === obj2.toString();
        }
        if (isArray(obj1)) {
            if (!isArray(obj2)) { return false; }
            if (obj1.length !== obj2.length) { return false; }
            var length = obj1.length;
            for (var i = 0; i < length; i++) {
                if (!deepEqual(obj1[i], obj2[i])) { return false; }
            }
            return true;
        } else {
            if (isArray(obj2)) { return false; }
        }
        var name;
        for (name in obj2) {
            if (typeof obj1[name] === 'undefined') { return false; }
        }
        for (name in obj1) {
            if (!deepEqual(obj1[name], obj2[name])) { return false; }
        }
        return true;
    }
    return false;
}

exports.deepEqual = deepEqual;

function assertionDeepEqual(obj) {
    this.assert(
        deepEqual(this.obj, obj),
        function(){
            return 'expected ' + JSON.stringify(this.obj) + ' to be ' + JSON.stringify(obj);
        },
        function(){
            return 'expected ' + JSON.stringify(this.obj) + ' not to be ' + JSON.stringify(obj);
        });
    return this;
}

exports.assertionDeepEqual = assertionDeepEqual;

function valueDescription(value) {
    if (value === null) {
        return 'null';
    }
    if (typeof value === 'boolean') {
        return value.toString();
    }
    if (value instanceof Date) {
        return 'Date';
    }
    if (isArray(value)) {
        return 'array';
    }
    if (typeof value === 'string') {
        if (value.length >= 60) {
            return 'large text';
        }
    }
    return typeof value;
}

exports.valueDescription = valueDescription;

function clone(obj) {
    if (typeof obj === 'undefined') {
        return undefined;
    }
    return JSON.parse(JSON.stringify(obj), dateReviver);
}

exports.clone = clone;

// Object.keys polyfill
var objectKeys = (typeof Object.keys === 'function') ?
function(obj) {
    return Object.keys(obj);
} :
function(obj) {
    var keys = [];
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            keys.push(key);
        }
    }
    return keys;
};

exports.objectKeys = objectKeys;

// Array.prototype.forEach polyfill
var arrayForEach = (typeof Array.prototype.forEach === 'function') ?
function(array, fn) {
    return array.forEach(fn);
} :
function(array, fn) {
    for (var index = 0, length = array.length; index < length; index++) {
        fn(array[index], index, array);
    }
};

exports.arrayForEach = arrayForEach;

function forEach(obj, fn) {
  if (isArray(obj)) {
    arrayForEach(obj, fn);
  } else {
    arrayForEach(objectKeys(obj), function(key){
      fn(obj[key], key);
    });
  }
}

exports.forEach = forEach;
