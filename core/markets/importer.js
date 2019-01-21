const _ = require('lodash');
const util = require('../util');
const config = util.getConfig();
const dirs = util.dirs();
const log = require(dirs.core + 'log');
const moment = require('moment');
const gekkoEnv = util.gekkoEnv();

const adapter = config[config.adapter];
const daterange = config.importer.daterange;

const from = moment.utc(daterange.from);

let to;
if(daterange.to) {
  to = moment.utc(daterange.to);
} else {
  to = moment().utc();
  log.debug(
    'No end date specified for importing, setting to',
    to.format()
  );
}
log.debug(to.format());

if(!from.isValid())
  util.die('invalid `from`');

if(!to.isValid())
  util.die('invalid `to`');

const TradeBatcher = require(dirs.budfox + 'tradeBatcher');
const CandleManager = require(dirs.budfox + 'candleManager');
const exchangeChecker = require(dirs.gekko + 'exchange/exchangeChecker');

const error = exchangeChecker.cantFetchFullHistory(config.watch);
if(error)
  util.die(error, true);

const fetcher = require(dirs.importers + config.watch.exchange);

if(to <= from)
  util.die('This daterange does not make sense.');

const Market = function() {
  _.bindAll(this);
  this.exchangeSettings = exchangeChecker.settings(config.watch);

  this.tradeBatcher = new TradeBatcher(this.exchangeSettings.tid);
  this.candleManager = new CandleManager;
  this.fetcher = fetcher({
    to: to,
    from: from,
  });

  this.done = false;

  this.fetcher.bus.on(
    'trades',
    this.processTrades,
  );

  this.fetcher.bus.on(
    'done',
    function() {
      this.done = true;
    }.bind(this),
  );

  this.tradeBatcher.on(
    'new batch',
    this.candleManager.processTrades,
  );

  this.candleManager.on(
    'candles',
    this.pushCandles,
  );

  Readable.call(this, { objectMode: true });

  this.get();
};

const Readable = require('stream').Readable;
Market.prototype = Object.create(Readable.prototype, {
  constructor: { value: Market }
});

Market.prototype._read = _.noop;

Market.prototype.pushCandles = function(candles) {
  _.each(candles, this.push);
};

Market.prototype.get = function() {
  this.fetcher.fetch();
};

Market.prototype.processTrades = function(trades) {
  this.tradeBatcher.write(trades);

  if(this.done) {
    log.info('Done importing!');
    this.emit('end');
    return;
  }

  if(_.size(trades) && gekkoEnv === 'child-process') {
    let lastAtTS = _.last(trades).date;
    let lastAt = moment.unix(lastAtTS).utc().format();
    process.send({event: 'marketUpdate', payload: lastAt});
  }

  setTimeout(this.get, 1000);
};

module.exports = Market;
