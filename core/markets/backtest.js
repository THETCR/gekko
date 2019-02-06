const _ = require('lodash');
const util = require('../util');
const config = util.getConfig();
const dirs = util.dirs();
const log = require(dirs.core + 'log');
const moment = require('moment');

const adapter = config[config.adapter];
const Reader = require(dirs.gekko + adapter.path + '/reader');
const daterange = config.backtest.daterange;

const to = moment.utc(daterange.to);
const from = moment.utc(daterange.from);

if (to <= from)
  util.die('This daterange does not make sense.');

if (!from.isValid())
  util.die('invalid `from`');

if (!to.isValid())
  util.die('invalid `to`');

const Market = function () {

  _.bindAll(this);
  this.pushing = false;
  this.ended = false;
  this.closed = false;

  Readable.call(this, { objectMode: true });

  log.write('');
  log.info('\tWARNING: BACKTESTING FEATURE NEEDS PROPER TESTING');
  log.info('\tWARNING: ACT ON THESE NUMBERS AT YOUR OWN RISK!');
  log.write('');

  this.reader = new Reader();
  this.batchSize = config.backtest.batchSize;
  this.iterator = {
    from: from.clone(),
    to: from.clone().add(this.batchSize, 'm').subtract(1, 's'),
  };
};

const Readable = require('stream').Readable;
Market.prototype = Object.create(Readable.prototype, {
  constructor: { value: Market }
});

Market.prototype._read = _.once(function () {
  this.get();
});

Market.prototype.get = function () {
  if (this.iterator.to >= to) {
    this.iterator.to = to;
    this.ended = true;
  }

  this.reader.get(
    this.iterator.from.unix(),
    this.iterator.to.unix(),
    'full',
    this.processCandles
  )
};

Market.prototype.processCandles = function (err, candles) {
  this.pushing = true;
  const amount = _.size(candles);

  if (amount === 0) {
    if (this.ended) {
      this.closed = true;
      this.reader.close();
      this.push({ isFinished: true });
    } else {
      util.die('Query returned no candles (do you have local data for the specified range?)');
    }
  }

  if (!this.ended && amount < this.batchSize) {
    const d = function (ts) {
      return moment.unix(ts).utc().format('YYYY-MM-DD HH:mm:ss');
    };
    const from = d(_.first(candles).start);
    const to = d(_.last(candles).start);
    log.warn(`Simulation based on incomplete market data (${this.batchSize - amount} missing between ${from} and ${to}).`);
  }

  _.each(candles, function (c, i) {
    c.start = moment.unix(c.start);
    this.push(c);
  }, this);

  this.pushing = false;

  this.iterator = {
    from: this.iterator.from.clone().add(this.batchSize, 'm'),
    to: this.iterator.from.clone().add(this.batchSize * 2, 'm').subtract(1, 's')
  };

  if (!this.closed)
    this.get();
};

module.exports = Market;
