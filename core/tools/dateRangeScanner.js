const BATCH_SIZE = 60; // minutes
const MISSING_CANDLES_ALLOWED = 3; // minutes, per batch

const _ = require('lodash');
const moment = require('moment');
const async = require('async');

const util = require('../util');
const config = util.getConfig();
const dirs = util.dirs();
const log = require(dirs.core + 'log');

const adapter = config[config.adapter];
const Reader = require(dirs.gekko + adapter.path + '/reader');

const reader = new Reader();

// todo: rewrite with generators or async/await..
const scan = function (done) {
  log.info('Scanning local history for backtestable dateranges.');

  reader.tableExists('candles', (err, exists) => {

    if (err)
      return done(err, null, reader);

    if (!exists)
      return done(null, [], reader);

    async.parallel({
      boundry: reader.getBoundry,
      available: reader.countTotal,
    }, (err, res) => {

      const first = res.boundry.first;
      const last = res.boundry.last;

      const optimal = (last - first) / 60;

      log.debug('Available', res.available);
      log.debug('Optimal', optimal);

      // There is a candle for every minute
      if (res.available === optimal + 1) {
        log.info('Gekko is able to fully use the local history.');
        return done(false, [{
          from: first,
          to: last,
        }], reader);
      }

      // figure out where the gaps are..

      const missing = optimal - res.available + 1;

      log.info(`The database has ${missing} candles missing, Figuring out which ones...`);

      const iterator = {
        from: last - (BATCH_SIZE * 60),
        to: last,
      };

      const batches = [];

      // loop through all candles we have
      // in batches and track whether they
      // are complete
      async.whilst(
        () => {
          return iterator.from > first;
        },
        next => {
          const from = iterator.from;
          const to = iterator.to;
          reader.count(
            from,
            iterator.to,
            (err, count) => {
              const complete = count + MISSING_CANDLES_ALLOWED > BATCH_SIZE;

              if (complete)
                batches.push({
                  to: to,
                  from: from,
                });

              next();
            },
          );

          iterator.from -= BATCH_SIZE * 60;
          iterator.to -= BATCH_SIZE * 60;
        },
        () => {
          if (batches.length === 0) {
            return done(null, [], reader);
          }

          // batches is now a list like
          // [ {from: unix, to: unix } ]

          let ranges = [batches.shift()];

          _.each(batches, batch => {
            const curRange = _.last(ranges);
            if (batch.to === curRange.from)
              curRange.from = batch.from;
            else
              ranges.push(batch);
          });

          // we have been counting chronologically reversed
          // (backwards, from now into the past), flip definitions
          ranges = ranges.reverse();

          _.map(ranges, r => {
            return {
              from: r.to,
              to: r.from,
            };
          });


          // ranges is now a list like
          // [ {from: unix, to: unix } ]
          //
          // it contains all valid dataranges available for the
          // end user.

          return done(false, ranges, reader);
        },
      );
    });

  });
};

module.exports = scan;
