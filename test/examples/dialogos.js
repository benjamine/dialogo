
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
    name: 'existing',
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
  {
    name: 'new',
    peers: {
      a: {
        load: {
          url: 'example',
          options: {
            create: true
          }
        },
        patch: [null, clone(exampleObject1)]
      },
      b: {
        hub: true,
        storage: {
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
        root: clone(exampleObject1)
      }
    }
  },
  0
];

examples.oneSideChange = [
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

examples.bothSideChanges = [
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
