const _ = require('lodash');
const moment = require('moment');

const util = require('../../core/util.js');
const log = require('../../core/log');

const config = util.getConfig();

const dirs = util.dirs();

const Fetcher = require(dirs.exchanges + 'kraken');

util.makeEventEmitter(Fetcher);

let end = false;
const done = false;
let from = false;

let lastId = false;
let prevLastId = false;

const fetcher = new Fetcher(config.watch);

const fetch = () => {
  fetcher.import = true;

  if (lastId) {
    const tidAsTimestamp = lastId / 1000000;
    setTimeout(() => {
      fetcher.getTrades(tidAsTimestamp, handleFetch);
    }, 500);
  } else
    fetcher.getTrades(from, handleFetch);
};

const handleFetch = (err, trades) => {
    if(!err && !trades.length) {
        console.log('no trades');
        err = 'No trades';
    }

    if (err) {
        log.error(`There was an error importing from Kraken ${err}`);
        fetcher.emit('done');
        return fetcher.emit('trades', []);
    }

  const last = moment.unix(_.last(trades).date).utc();
  lastId = _.last(trades).tid;
    if(last < from) {
        log.debug('Skipping data, they are before from date', last.format());
        return fetch();
    }

    if  (last > end || lastId === prevLastId) {
        fetcher.emit('done');

      const endUnix = end.unix();
      trades = _.filter(
            trades,
            t => t.date <= endUnix
        )
    }

    prevLastId = lastId;
    fetcher.emit('trades', trades);
};

module.exports = function (daterange) {

    from = daterange.from.clone();
    end = daterange.to.clone();

    return {
        bus: fetcher,
        fetch: fetch
    }
};


