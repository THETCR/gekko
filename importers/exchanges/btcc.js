const BTCChina = require('btc-china-fork');
const _ = require('lodash');
const moment = require('moment');
const util = require('../../core/util.js');
const log = require('../../core/log');

const config = util.getConfig();

const dirs = util.dirs();

const Fetcher = require(dirs.exchanges + 'btcc');

// patch getTrades..
Fetcher.prototype.getTrades = function (fromTid, sinceTime, callback) {
  const args = _.toArray(arguments);
  const process = function (err, result) {
    if (err)
      return this.retry(this.getTrades, args);

    callback(result);
  }.bind(this);

  let params;

  if (sinceTime)
    params = {
      limit: 1,
      sincetype: 'time',
      since: sinceTime
    };

  else if (fromTid)
    params = {
      limit: 5000,
      since: fromTid
    };

  this.btcc.getHistoryData(process, params);
};

util.makeEventEmitter(Fetcher);

let iterator = false;
let end = false;
const done = false;
let from = false;

const fetcher = new Fetcher(config.watch);

const fetch = () => {
  if (!iterator)
    fetcher.getTrades(false, from, handleFirstFetch);
  else
    fetcher.getTrades(iterator, false, handleFetch);
};

// we use the first fetch to figure out
// the tid of the moment we want data from
const handleFirstFetch = trades => {
  iterator = _.first(trades).tid;
  fetch();
};

const handleFetch = trades => {

  iterator = _.last(trades).tid;
  const last = moment.unix(_.last(trades).date);

  if (last > end) {
    fetcher.emit('done');

    const endUnix = end.unix();
    trades = _.filter(
      trades,
      t => t.date <= endUnix
    );
  }

  fetcher.emit('trades', trades);
};

module.exports = function (daterange) {
  from = daterange.from.unix();
  end = daterange.to.clone();

  return {
    bus: fetcher,
    fetch: fetch
  }
};

