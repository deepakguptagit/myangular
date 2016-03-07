'use strict';

var _ = require('lodash');

var initWatchVal = function() { };

exports.Scope = function() {
  this.$$watchers = [];
  this.$$lastDirtyWatch = null;
  this.$$asyncQueue = [];
  this.$$phase = null;
};

exports.Scope.prototype.$watch = function(watchFn, listenerFn, valueEq) {
  var watcher = {
    watchFn: watchFn,
    listenerFn: listenerFn || function() { },
    valueEq: !!valueEq,
    last: initWatchVal,
  };
  this.$$watchers.push(watcher);
};

exports.Scope.prototype.$$areEqual = function(newValue, oldValue, valueEq) {
  if (valueEq) {
    return _.isEqual(newValue, oldValue);
  } else {
    return (newValue === oldValue) ||
        (typeof newValue === 'number' && typeof oldValue === 'number' &&
         isNaN(newValue) && isNaN(oldValue));
  }
};

exports.Scope.prototype.$digestOnce = function() {
  var self = this;
  var dirty;
  _.forEach(this.$$watchers, function(watcher) {
    var newValue = watcher.watchFn(self);
    var oldValue = watcher.last;
    var valueEq = watcher.valueEq;
    if (!self.$$areEqual(newValue, oldValue, valueEq)) {
      self.$$lastDirtyWatch = watcher;
      watcher.last = (watcher.valueEq ? _.cloneDeep(newValue) : newValue);
      watcher.listenerFn(
          newValue,
          (oldValue === initWatchVal ? newValue : oldValue),
          self);
      dirty = true;
    } else if (self.$$lastDirtyWatch === watcher) {
      return false;
    }
  });
  return dirty;
};

exports.Scope.prototype.$digest = function() {
  var ttl = 10;
  var dirty;
  this.$$lastDirtyWatch = null;
  this.$beginPhase('$digest');
  do {
    while(this.$$asyncQueue.length) {
      var asyncTask = this.$$asyncQueue.shift();
      asyncTask.scope.$eval(asyncTask.expression);
    }
    dirty = this.$digestOnce();
    if ((dirty || this.$$asyncQueue.length) && !(ttl--)) {
      this.$clearPhase();
      throw new Error('10 digest iterations reached');
    }
  } while (dirty || this.$$asyncQueue.length);
  this.$clearPhase();
};

exports.Scope.prototype.$eval = function(expr, locals) {
  return expr(this, locals);
};

exports.Scope.prototype.$apply = function(expr) {
  try {
    this.$beginPhase('$apply');
    return this.$eval(expr);
  } finally {
    this.$clearPhase();
    this.$digest();
  }
};

exports.Scope.prototype.$evalAsync = function(expr) {
  this.$$asyncQueue.push({scope: this, expression: expr});
};

exports.Scope.prototype.$beginPhase = function(phase) {
  if (this.$$phase) {
    throw this.$$phase + ' already in progress';
  }
  this.$$phase = phase;
}

exports.Scope.prototype.$clearPhase = function() {
  this.$$phase = null;
}
