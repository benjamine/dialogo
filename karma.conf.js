module.exports = function(config) {
    config.set({
        basePath: '.',
        frameworks: ['mocha'],
        files: [
            'build/bundle.js',
            'test-external/expect.js',
            'build/test-bundle.js'
        ],
        reporters : ['spec', 'growler']
    });
};
