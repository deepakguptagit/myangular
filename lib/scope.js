'use strict';

var _ = require('lodash');

var initWatchVal = function() { };

exports.Scope = function() {
  this.$$watchers = [];
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
      watcher.last = newValue;
      watcher.listenerFn(
          newValue,
          (oldValue === initWatchVal ? newValue : oldValue),
          self);
      dirty = true;
    }
  });
  return dirty;
};

exports.Scope.prototype.$digest = function() {
  var dirty;
  do {
    dirty = this.$digestOnce();
  } while (dirty);
};
