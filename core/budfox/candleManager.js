// The candleManager consumes trades and emits:
// - `candles`: array of minutly candles.
// - `candle`: the most recent candle after a fetch Gekko.

const _ = require('lodash');
const moment = require('moment');
const fs = require('fs');

const util = require(__dirname + '/../util');
const dirs = util.dirs();
const config = util.getConfig();
const log = require(dirs.core + 'log');

const CandleCreator = require(dirs.budfox + 'candleCreator');

const Manager = function() {
  _.bindAll(this);

  this.candleCreator = new CandleCreator;

  this.candleCreator
    .on('candles', this.relayCandles);
};

util.makeEventEmitter(Manager);
Manager.prototype.processTrades = function(tradeBatch) {
  this.candleCreator.write(tradeBatch);
};

Manager.prototype.relayCandles = function(candles) {
  this.emit('candles', candles);
};

module.exports = Manager;
