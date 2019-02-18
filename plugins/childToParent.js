// Small plugin that subscribes to some events, stores
// them and sends it to the parent process.

const _ = require('lodash');
const log = require('../core/log');
const subscriptions = require('../subscriptions');
const config = require('../core/util').getConfig();

const ChildToParent = function () {

  subscriptions
  // .filter(sub => config.childToParent.events.includes(sub.event))
  .forEach(sub => {
    this[sub.handler] = (event, next) => {
      process.send({ type: sub.event, payload: event });
      if (_.isFunction(next)) {
        next();
      }
    }
  }, this);

};

module.exports = ChildToParent;
