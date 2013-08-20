var moduleFactory = function(exports) {
    'use strict';

    var extend = function(target, source, options) {
        var opt = options || {};
        if (typeof source !== 'object') {
            return target;
        }
        for (var name in source) {
            if (source.hasOwnProperty(name)) {
                if (opt.recursive && typeof target[name] === 'object' &&
                    typeof source[name] === 'object' &&
                    !(target instanceof Array) &&
                    !(source instanceof Array)) {
                    extend(target[name], source[name], opt);
                } else {
                    if (opt.memberCopy) {
                        opt.memberCopy(target, source, name);
                    } else {
                        target[name] = source[name];
                    }
                }
            }
        }
        return target;
    };

    var dialogo = exports;
    extend(dialogo, {
        version: '0.0.1',
        conventions: {
        }
    });

    var conventions = dialogo.conventions;

    var Dialogo = dialogo.Dialogo = function Dialogo(){
        this.documents = {};
        this.transports = {};
    };

    dialogo.create = function(){
        return new Dialogo();
    };

};
/* global exports */
if (typeof require === 'undefined') {
    moduleFactory(window.dialogo = {});
} else if (typeof exports === 'undefined') {
    /* global define */
    define('dialogo', ['exports'], moduleFactory);
} else {
    moduleFactory(exports);
}
