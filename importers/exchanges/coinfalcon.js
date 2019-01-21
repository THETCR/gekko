const moment = require('moment');
const util = require('../../core/util.js');
const _ = require('lodash');
const log = require('../../core/log');

const config = util.getConfig();
const dirs = util.dirs();

const Fetcher = require(dirs.exchanges + 'coinfalcon');

util.makeEventEmitter(Fetcher);

let end = false;
const done = false;
let from = false;

const fetcher = new Fetcher(config.watch);

const fetch = () => {
  fetcher.import = true;
  log.debug('[CoinFalcon] Getting trades from: ', from);
  fetcher.getTrades(from, handleFetch, true);
};

const handleFetch = (unk, trades) => {
  let next;
  if (trades.length > 0) {
    const last = moment.unix(_.last(trades).date).utc();
    next = last.clone();
  } else {
    next = from.clone().add(1, 'h');
    log.debug('Import step returned no results, moving to the next 1h period');
  }

  if (from.add(1, 'h') >= end) {
    fetcher.emit('done');

    const endUnix = end.unix();
    trades = _.filter(trades, t => t.date <= endUnix);
  }

  from = next.clone();
  fetcher.emit('trades', trades);
};

module.exports = function(daterange) {
  from = daterange.from.clone().utc();
  end = daterange.to.clone().utc();

  return {
    bus: fetcher,
    fetch: fetch,
  };
};
