
var jsondiffpatch = jsondiffpatch || require('jsondiffpatch');
var testutil = require('../testutil');
var clone = testutil.clone;

var examples = {};

var exampleObject1 = {
  a: 1,
  b: 'two',
  c: {
    d: [4, 5, 6],
    f: true
  }
};

examples.load = [
  {
    name: 'remote',
    peers: {
      a: {
        load: 'example',
      },
      b: {
        hub: true,
        storage: {
          example: clone(exampleObject1)
        }
      }
    },
    result: {
      stats: {
        messages: {
          sent: {
            max: 1,
            total: 2
          }
        }
      },
      alldocs: {
        root: clone(exampleObject1)
      }
    }
  },
  0
];

examples.one_side_change = [
  {
    name: 'property add',
    peers: {
      a: {
        doc: {
          root: clone(exampleObject1)
        }
      },
      b: {
        hub: true,
        doc: {
          root: clone(exampleObject1)
        },
        patch: {
          x: ['this is added']
        }
      }
    },
    result: {
      stats: {
        messages: {
          sent: {
            max: 2,
            total: 3
          }
        }
      },
      alldocs: {
        root: jsondiffpatch.patch(clone(exampleObject1), {
          x: [ 'this is added']
        })
      }
    }
  },
  0
];

examples.both_side_changes = [
  {
    name: 'different properties added',
    peers: {
      a: {
        doc: {
          root: clone(exampleObject1)
        },
        patch: {
          x: ['this is added']
        }
      },
      b: {
        hub: true,
        doc: {
          root: clone(exampleObject1)
        },
        patch: {
          y: ['this is added too']
        }
      }
    },
    result: {
      stats: {
        messages: {
          sent: {
            max: 2,
            total: 4
          }
        }
      },
      alldocs: {
        root: jsondiffpatch.patch(clone(exampleObject1), {
          x: [ 'this is added'],
          y: [ 'this is added too']
        })
      }
    }
  },
  0
];


module.exports = examples;
