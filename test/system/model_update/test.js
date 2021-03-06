var assert = require('assert'),
    http = require('http'),
    fs = require('fs'),
    testUtil = require('../test-util'),
    gh = require('../../../grasshopper');

require('./test-routes');

var suite = {name: 'Dispatch System Tests'};
exports.suite = suite;

suite.setupOnce = function(next) {
    gh.serve(8080, function() {
        next();
    });
};

suite.tests = {
    'Nested models.': function(next) {
        testUtil.invoke('POST', '/people', {}, 'person.name=Chandru'
                            + '&person.address.city=Bangalore'
                            + '&person.address.country=India',
        function(res) {
            res.on('data', function(chunk) {
                assert.equal(chunk, 'Chandru Bangalore India\n');
                next();
            });
        });
    },

    'Array values with a *.': function(next) {
        testUtil.invoke('POST', '/countries', {}, 'country.name=India'
                            + '&country.*cities=Bangalore'
                            + '&country.*cities=Chennai',
        function(res) {
            res.on('data', function(chunk) {
                assert.equal(chunk, 'India Bangalore Chennai\n');
                next();
            });
        });
    },

    'Array values with [].': function(next) {
        if(process.version.split('.')[1] < 3) {
            next();
            return;
        }
        testUtil.invoke('POST', '/countries', {}, 'country.name=India'
                            + '&country.cities[]=Bangalore'
                            + '&country.cities[]=Chennai',
        function(res) {
            res.on('data', function(chunk) {
                assert.equal(chunk, 'India Bangalore Chennai\n');
                next();
            });
        });
    }
}

suite.tearDownOnce = function(next) {
    gh.stop();
    next();
};

if(process.argv[1] == __filename)
    require('../../common/ghunit').test(suite);
