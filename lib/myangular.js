/*
 * myangular
 * https://github.com/deepakguptaatgit/myangular
 *
 * Copyright (c) 2016 Deepak Gupta
 * Licensed under the MIT license.
 */

'use strict';

var _ = require('lodash');

exports.awesome = function(to) {
  return _.template("Hello, <%= name %>!")({name: to});
};
