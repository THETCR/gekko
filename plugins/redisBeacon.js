const log = require('../core/log.js');
const util = require('../core/util');
const config = util.getConfig();
const redisBeacon = config.redisBeacon;
const watch = config.watch;

const subscriptions = require('../subscriptions');
const _ = require('lodash');

const redis = require('redis');

const Actor = function(done) {
  _.bindAll(this);

  this.market = [
    watch.exchange,
    watch.currency,
    watch.asset,
  ].join('-');

  this.init(done);
};

// This actor is dynamically build based on
// what the config specifies it should emit.
//
// This way we limit overhead because Gekko
// only binds to events redis is going to
// emit.

const proto = {};
_.each(redisBeacon.broadcast, function(e) {
  // grab the corresponding subscription
  const subscription = _.find(subscriptions, function(s) {
    return s.event === e;
  });

  if(!subscription)
    util.die('Gekko does not know this event:' + e);

  const channel = redisBeacon.channelPrefix + subscription.event;

  proto[subscription.handler] = function(message, cb) {
    if(!_.isFunction(cb))
      cb = _.noop;

    this.emit(channel, {
      market: this.market,
      data: message
    }, cb);
  };

}, this);

Actor.prototype = proto;

Actor.prototype.init = function(done) {
  this.client = redis.createClient(redisBeacon.port, redisBeacon.host);
  this.client.on('ready', _.once(done));
};

Actor.prototype.emit = function(channel, message) {
  log.debug('Going to publish to redis channel:', channel);

  const data = JSON.stringify(message);
  this.client.publish(channel, data);
};

module.exports = Actor;
