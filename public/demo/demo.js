(function demo(){

    var dom = {
        addClass: function(el, className) {
            if (el.classList) {
                el.classList.add(className);
            } else {
                el.className += ' ' + className;
            }
        },
        removeClass: function(el, className) {
            if (el.classList) {
                el.classList.remove(className);
            } else {
                el.className = el.className.replace(new RegExp('(^|\\b)' +
                    className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
            }
        },
        text: function(el, text) {
            if (typeof el.textContent !== 'undefined') {
                if (typeof text === 'undefined') {
                    return el.textContent;
                }
                el.textContent = text;
            } else {
                if (typeof text === 'undefined') {
                    return el.innerText;
                }
                el.innerText = text;
            }
        },
        on: function(el, eventName, handler) {
            if (el.addEventListener) {
                el.addEventListener(eventName, handler);
            } else {
                el.attachEvent('on' + eventName, handler);
            }
        },
        ready: function(fn) {
            if (document.addEventListener) {
                document.addEventListener('DOMContentLoaded', fn);
            } else {
                document.attachEvent('onreadystatechange', function() {
                    if (document.readyState === 'interactive') { fn(); }
                });
            }
        },
        getJson: function(url, callback) {
            var request = new XMLHttpRequest();
            request.open('GET', url, true);
            request.onreadystatechange = function() {
                if (this.readyState === 4){
                    var data;
                    try {
                        data = JSON.parse(this.responseText, jsondiffpatch.dateReviver);
                    } catch (parseError) {
                        callback('parse error: ' + parseError);
                    }
                    if (this.status >= 200 && this.status < 400){
                        callback(null, data);
                    } else {
                        callback(new Error('request failed'), data);
                    }
                }
            };
            request.send();
            request = null;
        },
        runScriptTags: function(el) {
            var scripts = el.querySelectorAll('script');
            for (var i = 0; i < scripts.length; i++) {
                var s = scripts[i];
                /* jshint evil: true */
                eval(s.innerHTML);
            }
        }
    };

    var trim = function(str) {
        return str.replace(/^\s+|\s+$/g, '');
    };

    var JsonArea = function JsonArea(element) {
        this.element = element;
        this.container = element.parentNode;
        var self = this;
        var prettifyButton = this.container.querySelector('.prettyfy');
        if (prettifyButton) {
            dom.on(prettifyButton, 'click', function() {
                self.prettyfy();
            });
        }
    };

    JsonArea.prototype.error = function(err) {
        var errorElement = this.container.querySelector('.error-message');
        if (!err) {
            dom.removeClass(this.container, 'json-error');
            errorElement.innerHTML = '';
            return;
        }
        errorElement.innerHTML = err+'';
        dom.addClass(this.container, 'json-error');
    };

    JsonArea.prototype.getValue = function(){
        if (!this.editor) { return this.element.value; }
        return this.editor.getValue();
    };

    JsonArea.prototype.parse = function() {
        var txt = trim(this.getValue());
        try {
            this.error(false);
            if (/^\d+(.\d+)?(e[\+\-]?\d+)?$/i.test(txt) ||
                /^(true|false)$/.test(txt) ||
                /^["].*["]$/.test(txt) ||
                /^[\{\[](.|\n)*[\}\]]$/.test(txt)) {
                return JSON.parse(txt, jsondiffpatch.dateReviver);
            }
            return this.getValue();
        } catch(err) {
            this.error(err);
            throw err;
        }
    };

    JsonArea.prototype.setValue = function(value) {
        if (!this.editor) { this.element.value = value; return; }
        this.editor.setValue(value);
    };

    JsonArea.prototype.prettyfy = function() {
        var value = this.parse();
        var prettyJson = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
        this.setValue(prettyJson);
    };

    /* global CodeMirror */
    JsonArea.prototype.makeEditor = function(readOnly) {
        if (typeof CodeMirror === 'undefined') { return; }
        this.editor = CodeMirror.fromTextArea(this.element, {
            mode:  'javascript',
            json: true,
            readOnly: readOnly
        });
        if (!readOnly) {
            this.editor.on('change', compare);
        }
    };

    var areas = {
        left: new JsonArea(document.getElementById('json-input-left')),
        right: new JsonArea(document.getElementById('json-input-right')),
        delta: new JsonArea(document.getElementById('json-delta'))
    };

    function start(){

    }

    function update(){

    }

    areas.left.makeEditor();
    areas.right.makeEditor();

    dom.on(areas.left.element, 'change', update);
    dom.on(areas.right.element, 'change', update);
    dom.on(areas.left.element, 'keyup', update);
    dom.on(areas.right.element, 'keyup', update);

    dom.on(document.getElementById('clear'), 'click', function(){
        areas.left.setValue('');
        areas.right.setValue('');
    });

    dom.ready(setTimeout(start));

    var urlQuery = /^[^?]*\?([^\#]+)/.exec(document.location.href);

})();
