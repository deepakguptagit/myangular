'use strict';

var _ = require('lodash');

var initWatchVal = function() { };

exports.Scope = function() {
  this.$$watchers = [];
  this.$$lastDirtyWatch = null;
};

exports.Scope.prototype.$watch = function(watchFn, listenerFn) {
  var watcher = {
    watchFn: watchFn,
    listenerFn: listenerFn || function() { },
    last: initWatchVal,
  };
  this.$$watchers.push(watcher);
};

exports.Scope.prototype.$digestOnce = function() {
  var self = this;
  var dirty;
  _.forEach(this.$$watchers, function(watcher) {
    var newValue = watcher.watchFn(self);
    var oldValue = watcher.last;
    if (newValue !== oldValue) {
      self.$$lastDirtyWatch = watcher;
      watcher.last = newValue;
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
  var self = this;
  var ttl = 10;
  var dirty;
  this.$$lastDirtyWatch = null;
  do {
    dirty = this.$digestOnce();
    if (dirty && !(ttl--)) {
      throw new Error('10 digest iterations reached');
    }
  } while (dirty);
};

