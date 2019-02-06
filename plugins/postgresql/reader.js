const _ = require('lodash');
const util = require('../../core/util.js');
const config = util.getConfig();
const log = require(util.dirs().core + 'log');

const handle = require('./handle');
const postgresUtil = require('./util');

const { Query } = require('pg');

const Reader = function () {
  _.bindAll(this);
  this.db = handle;
};

// returns the furthest point (up to `from`) in time we have valid data from
Reader.prototype.mostRecentWindow = function (from, to, next) {
  to = to.unix();
  from = from.unix();

  const maxAmount = to - from + 1;

  this.db.connect((err, client, done) => {
    const query = client.query(new Query(`
    SELECT start from ${postgresUtil.table('candles')}
    WHERE start <= ${to} AND start >= ${from}
    ORDER BY start DESC
    `), function (err, result) {
      if (err) {
        // bail out if the table does not exist
        if (err.message.indexOf(' does not exist') !== -1)
          return next(false);

        log.error(err);
        return util.die('DB error while reading mostRecentWindow');
      }
    });

    const rows = [];
    query.on('row', function (row) {
      rows.push(row);
    });

    // After all data is returned, close connection and return results
    query.on('end', function () {
      done();
      // no candles are available
      if (rows.length === 0) {
        return next(false);
      }

      if (rows.length === maxAmount) {

        // full history is available!

        return next({
          from: from,
          to: to
        });
      }

      // we have at least one gap, figure out where
      const mostRecent = _.first(rows).start;

      const gapIndex = _.findIndex(rows, function (r, i) {
        return r.start !== mostRecent - i * 60;
      });

      // if there was no gap in the records, but
      // there were not enough records.
      if (gapIndex === -1) {
        const leastRecent = _.last(rows).start;
        return next({
          from: leastRecent,
          to: mostRecent
        });
      }

      // else return mostRecent and the
      // the minute before the gap
      return next({
        from: rows[gapIndex - 1].start,
        to: mostRecent
      });
    });
  });
};

Reader.prototype.tableExists = function (name, next) {
  this.db.connect((err, client, done) => {
    client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema='${postgresUtil.schema()}'
        AND table_name='${postgresUtil.table(name)}';
    `, function (err, result) {
      done();
      if (err) {
        return util.die('DB error at `tableExists`');
      }

      next(null, result.rows.length === 1);
    });
  });
};

Reader.prototype.get = function (from, to, what, next) {
  if (what === 'full') {
    what = '*';
  }

  this.db.connect((err, client, done) => {
    const query = client.query(new Query(`
    SELECT ${what} from ${postgresUtil.table('candles')}
    WHERE start <= ${to} AND start >= ${from}
    ORDER BY start ASC
    `));

    const rows = [];
    query.on('row', function (row) {
      rows.push(row);
    });

    query.on('end', function () {
      done();
      next(null, rows);
    });
  });
};

Reader.prototype.count = function (from, to, next) {
  this.db.connect((err, client, done) => {
    const query = client.query(new Query(`
    SELECT COUNT(*) as count from ${postgresUtil.table('candles')}
    WHERE start <= ${to} AND start >= ${from}
    `));
    const rows = [];
    query.on('row', function (row) {
      rows.push(row);
    });

    query.on('end', function () {
      done();
      next(null, _.first(rows).count);
    });
  });
};

Reader.prototype.countTotal = function (next) {
  this.db.connect((err, client, done) => {
    const query = client.query(new Query(`
    SELECT COUNT(*) as count from ${postgresUtil.table('candles')}
    `));
    const rows = [];
    query.on('row', function (row) {
      rows.push(row);
    });

    query.on('end', function () {
      done();
      next(null, _.first(rows).count);
    });
  });
};

Reader.prototype.getBoundry = function (next) {
  this.db.connect((err, client, done) => {
    const query = client.query(new Query(`
    SELECT (
      SELECT start
      FROM ${postgresUtil.table('candles')}
      ORDER BY start LIMIT 1
    ) as first,
    (
      SELECT start
      FROM ${postgresUtil.table('candles')}
      ORDER BY start DESC
      LIMIT 1
    ) as last
    `));
    const rows = [];
    query.on('row', function (row) {
      rows.push(row);
    });

    query.on('end', function () {
      done();
      next(null, _.first(rows));
    });
  });
};

Reader.prototype.close = function () {
  //obsolete due to connection pooling
  //this.db.end();
};

module.exports = Reader;
