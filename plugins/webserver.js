const log = require('../core/log');
const moment = require('moment');
const _ = require('lodash');
const Server = require('../web/server.js');

const Actor = function(next) {
  _.bindAll(this);

  this.server = new Server();
  this.server.setup(next);
};

Actor.prototype.init = function(data) {
  this.server.broadcastHistory(data);
};

Actor.prototype.processCandle = function(candle, next) {
  this.server.broadcastCandle(candle);

  next();
};

Actor.prototype.processAdvice = function(advice) {
  this.server.broadcastAdvice(advice);
};

module.exports = Actor;
