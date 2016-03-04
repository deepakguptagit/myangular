'use strict';

var scope_module = require('../lib/scope.js');
var sinon = require('sinon');

exports['Scope'] = {
  setUp: function(done) {
    // setup here
    done();
  },
  'scope can be constructed and used as an object': function(test) {
    var scope = new scope_module.Scope();
    scope.aProperty = 1;
    test.equal(scope.aProperty, 1, 'scope object can be constructed.');
    test.done();
  },
};

exports['Digest'] = {
  setUp: function(done) {
    // setup here
    this.scope = new scope_module.Scope();
    done();
  },

  'calls the listener function of a watch on first $digest': function(test) {
    var watchFn = function() { return 'wat'; };
    var listenerFn = sinon.spy();
    this.scope.$watch(watchFn, listenerFn);

    this.scope.$digest();

    test.equal(listenerFn.called, true, 'listener function was called.');
    test.done();
  },

  'calls the watcher function with the scope as the argument': function(test) {
    var watchFn = sinon.spy();
    var listenerFn = function() { };
    this.scope.$watch(watchFn, listenerFn);

    this.scope.$digest();

    test.equal(watchFn.calledWith(this.scope), true, 'watcher function was called.');
    test.done();
  },

  'calls the listener function when the watched value changes': function(test) {
    this.scope.someValue = 'a';
    this.scope.counter = 0;

    this.scope.$watch(
        function(scope) { return scope.someValue; },
        function(newValue, oldValue, scope) { scope.counter++; }
        );

    test.equal(this.scope.counter, 0, 'scope counter was initialized with 0');

    this.scope.$digest();
    test.equal(this.scope.counter, 1, 'scope counter was 1 after calling digest once');

    this.scope.$digest();
    test.equal(this.scope.counter, 1, 'scope counter was 1 after calling digest twice');

    this.scope.someValue = 'b';
    test.equal(this.scope.counter, 1, 'somevalue is changed but digest is not called.');

    this.scope.$digest();
    test.equal(this.scope.counter, 2, 'scope counter was 2 after some value changed and digest called.');

    test.done();

  },

  'calls the listener when the watch value is first undefined': function(test) {
    this.scope.counter = 0;

    this.scope.$watch(
        function(scope) { return scope.someValue; },
        function(newValue, oldValue, scope) { scope.counter++;}
        );

    this.scope.$digest();

    test.equal(this.scope.counter, 1, 'call to $digest when watched value is not initialized.');
    test.done();
  },

  'calls the listener with the new value as the old value the first time': function(test) {
    this.scope.someValue = 123;
    var oldValueGiven;

    this.scope.$watch(
        function(scope) { return scope.someValue; },
        function(newValue, oldValue, scope) { oldValueGiven = oldValue; }
        );

    this.scope.$digest();

    test.equal(oldValueGiven, 123, 'call to $digest when watched value is not initialized.');
    test.done();
  },

  'may have watchers that omit the listener function': function(test) {
    var watchFn = sinon.spy();
    this.scope.$watch(watchFn);
    this.scope.$digest();

    test.equal(watchFn.called, true, 'watch fn was called without the corresponding listener');
    test.done();
  },

  'triggers chained watchers in the same digest': function(test) {
    this.scope.name = 'Deepak';

    this.scope.$watch(
        function(scope) {return scope.nameUpper;},
        function(newValue, oldValue, scope) {
          if (newValue) {
            scope.initial = newValue.substring(0, 1) + '.';
          }
        }
    );

    this.scope.$watch(
        function(scope) {return scope.name;},
        function(newValue, oldValue, scope) {
          if (newValue) {
            scope.nameUpper = newValue.toUpperCase();
          }
        }
    );

    this.scope.$digest();
    test.equal(this.scope.initial, 'D.', 'compares initial in first digest cycle');

    this.scope.name = 'Gokul';
    this.scope.$digest();
    test.equal(this.scope.initial, 'G.', 'compares initial when name changed and after second digest cycle.');

    test.done();
  },
};
