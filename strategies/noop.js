// This method is a noop (it doesn't do anything)

const _ = require('lodash');

// Let's create our own method
const method = {};

method.init = _.noop;
method.update = _.noop;
method.log = _.noop;
method.check = _.noop;

module.exports = method;
