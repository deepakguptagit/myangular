'use strict';

var scope_module = require('../lib/scope.js');
var sinon = require('sinon');
var _ = require('lodash');

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

  'gives up on watches after 10 iterations': function(test) {
    this.scope.counterA = 0;
    this.scope.counterB = 0;

    this.scope.$watch(
        function(scope) { return scope.counterA; },
        function(newValue, oldValue, scope) {
          scope.counterB++;
        }
    );

    this.scope.$watch(
        function(scope) { return scope.counterB; },
        function(newValue, oldValue, scope) {
          scope.counterA++;
        }
    );

    test.throws(
        function() { this.scope.$digest(); },
        Error,
        'digest throws an error for there are cyclic watchers and listeners.'
        );

    test.done();
  },

  'ends the digest when the last watch is clean': function(test) {
    var scope = this.scope;
    scope.array = _.range(100);

    var watchExecutions = 0;

    _.times(100, function(i) {
      scope.$watch(
          function(scope) {
            watchExecutions++;
            return scope.array[i];
          },
          function(newValue, oldValue, scope) {
          }
      );
    });

    scope.$digest();
    test.equal(watchExecutions, 200, 'There were 200 watch executions for the first time');

    scope.array[0] = 420;
    scope.$digest();
    test.equal(watchExecutions, 301, 'There were 301 executions when first watcher\'s var was changed.');
    test.done();
  },

  'compares based on value if enabled': function(test) {
    this.scope.aValue = [1, 2, 3];
    this.scope.counter = 0;

    this.scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        },
        true
    );

    this.scope.$digest();
    test.equal(this.scope.counter, 1, 'counter was 1 when scope was called only once.');

    this.scope.aValue.push(4);
    this.scope.$digest();
    test.equal(this.scope.counter, 2, 'change in value was detected when value of watched object is changed.');

    test.done();
  },

  'correctly handle NaNs': function(test) {
    this.scope.number = 0/0; // Nan
    this.scope.counter = 0;

    this.scope.$watch(
        function(scope) { return scope.number; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
    );

    this.scope.$digest();
    test.equal(this.scope.counter, 1, 'listener was called for the first time.')

    this.scope.$digest();
    test.equal(this.scope.counter, 1, 'Unequality of two NaNs does not lets listener called yet again.');

    test.done();
  },

  'executed $eval\'ed function and returns result': function(test) {
    this.scope.aValue = 42;

    var result = this.scope.$eval(function(scope) {
      return scope.aValue;
    });

    test.equal(result, 42, 'expression is evaluated as is.');

    test.done();
  },

  'passes the second $eval argument straight through': function(test) {
    this.scope.aValue = 42;

    var result = this.scope.$eval(function(scope, arg) {
      return scope.aValue + arg;
    }, 2);

    test.equal(result, 44, 'expression is evaluated successfully with extra argument');

    test.done();
  },
};
