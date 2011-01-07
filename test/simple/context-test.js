var assert = require('assert'),
    mocks = require('../common/mocks'),
    MockRequest = mocks.MockRequest,
    MockResponse = mocks.MockResponse;

var context = require('../../grasshopper/lib/context'),
    base64 = require('../../grasshopper/lib/base64'),
    RequestContext = context.RequestContext;

var suite = {name: 'Request Context Tests'};
exports.suite = suite;

suite.setupOnce = function(next) {
    mocks.mockModule('../../grasshopper/lib/i18n', {
        init: function(ctx) {
            ctx.locale = 'initialized-locale';
        }
    });
    next();
};

suite.tearDownOnce = function(next) {
    mocks.unmockModule('../../grasshopper/lib/i18n');
    next();
};

suite.tests = {
    'Context Initialization.': function(next) {
        var req = new MockRequest('GET', '/test.txt', {
            cookie: 'name=Chandru; city=Bangalore'
        });
        var res = new MockResponse();

        var ctx = new RequestContext(req, res);
        assert.equal(ctx.request, req);
        assert.equal(ctx.response, res);
        assert.deepEqual(ctx.model, {});
        assert.equal(ctx.status, 200);
        assert.equal(ctx.extn, 'txt');
        assert.equal(ctx.encoding, 'utf8');
        assert.equal(ctx.headers['content-type'], 'text/plain');
        assert.equal(ctx.headers['date'], new Date().toUTCString());
        assert.deepEqual(ctx.requestCookies, {
            name: 'Chandru',
            city: 'Bangalore'
        });
        assert.equal(ctx.locale, 'initialized-locale');
        assert.equal(ctx.charset, 'UTF-8');
        next();
    },

    'Render Text.': function(next) {
        var req = new MockRequest('GET', '/test.txt', {
            cookie: 'name=Chandru; city=Bangalore'
        });
        var res = new MockResponse();

        var ctx = new RequestContext(req, res);
        ctx.renderText('Hello');
        assert.deepEqual(res.headers, {
            'content-type': 'text/plain; charset=UTF-8',
            date: new Date().toUTCString(),
            'x-powered-by': 'Grasshopper/0.3.3'
        });
        assert.deepEqual(res.chunks, ['Hello']);
        assert.deepEqual(res.encodings, ['utf8']);
        assert.ok(!res.writable);
        next();
    },

    'Disable cache.': function(next) {
        var req = new MockRequest('GET', '/test.txt', {
            cookie: 'name=Chandru; city=Bangalore'
        });
        var res = new MockResponse();

        var ctx = new RequestContext(req, res);
        ctx.disableCache();
        assert.equal(ctx.headers['expires'], 'Thu, 11 Mar 2010 12:48:43 GMT');
        assert.equal(ctx.headers['cache-control'],
                        'no-store, no-cache, must-revalidate');
        assert.equal(ctx.headers['pragma'], 'no-cache');

        next();
    },

    'Basic getAuth().': function(next) {
        var req = new mocks.MockRequest('GET', '/', {
            authorization: 'Basic ' + base64.encode('Chandru:Pass')
        });
        var ctx = new RequestContext(req, new mocks.MockResponse());
        assert.deepEqual(ctx.getAuth(), {
            username: 'Chandru',
            password: 'Pass'
        });
        next();
    },

    'Digest getAuth().': function(next) {
        var req = new mocks.MockRequest('GET', '/', {
            authorization: 'Digest key1="value1", key2=value2'
        });
        var ctx = new RequestContext(req, new mocks.MockResponse());
        assert.deepEqual(ctx.getAuth(), {
            key1: 'value1',
            key2: 'value2'
        });
        next();
    },

    'Auth Challenge.': function(next) {
        var req = new mocks.MockRequest('GET', '/', {}),
            res = new mocks.MockResponse();

        var ctx = new RequestContext(req, res);
        ctx.challengeAuth('Digest', {key1: 'value1', key2: 'value2'});
        assert.deepEqual(ctx.headers['www-authenticate'], 
                         'Digest key1="value1",key2="value2"');
        next();
    },

    'Render Error.': function(next) {
        var req = new MockRequest('GET', '/test.txt', {
            cookie: 'name=Chandru; city=Bangalore'
        });
        var res = new MockResponse();

        var ctx = new RequestContext(req, res);
        ctx.renderError(500, function() {
            assert.equal(res.statusCode, 500);
            next();
        });
    }
};

if(process.argv[1] == __filename)
    require('../common/ghunit').test(suite);