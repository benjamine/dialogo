
var Document = require('./document').Document;
var Peer = require('./peer').Peer;
var Storage = require('./storage').Storage;

exports.Document = Document;
exports.Peer = Peer;
exports.Storage = Storage;
exports.jsondiffpatch = require('jsondiffpatch');


var inNode = typeof process !== 'undefined' && typeof process.execPath === 'string';
if (!inNode) {
	exports.homepage = '{{package-homepage}}';
	exports.version = '{{package-version}}';
}
