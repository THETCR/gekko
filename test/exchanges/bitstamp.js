
// if you need to test Gekko against real mocked data
// uncomment the following:

// var fs = require('fs');
// var bitstamp = require('bitstamp');
// var bs = new bitstamp;
// bs.transactions('btcusd', (err, data) => {
//   if(err)
//     throw err;

//   var json = JSON.stringify(data, null, 4);
//   fs.writeFileSync('./data/bitstamp_trades.json', json);
// });
// return;

const chai = require('chai');
const expect = chai.expect;
const should = chai.should;
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const _ = require('lodash');
const moment = require('moment');

const util = require(__dirname + '/../../core/util');
const config = util.getConfig();
const dirs = util.dirs();

const TRADES = require('./data/bitstamp_trades.json');

return; // TEMP

const FakeExchange = function() {
};
FakeExchange.prototype = {
  transactions: function(since, handler, descending) {
    handler(
      null,
      TRADES
    );
  }
};
const transactionsSpy = sinon.spy(FakeExchange.prototype, 'transactions');
let spoofer = {
  bitstamp: FakeExchange
};

describe('exchanges/bitstamp', function() {
  const Bitstamp = proxyquire(dirs.gekko + 'exchange/wrappers/bitstamp', spoofer);
  let bs;

  it('should instantiate', function() {
    bs = new Bitstamp(config.watch);
  });

  it('should correctly fetch historical trades', function() {
    bs.getTrades(null, _.noop, false);

    expect(transactionsSpy.callCount).to.equal(1);

    const args = transactionsSpy.lastCall.args;
    expect(args.length).to.equal(2);

    expect(args[0]).to.equal('btcusd');
  });

  it('should retry on exchange error', function() {
    const ErrorFakeExchange = function() {
    };
    ErrorFakeExchange.prototype = {
      transactions: function(since, handler, descending) {
        handler('Auth error');
      }
    };
    spoofer = {
      bitstamp: ErrorFakeExchange
    };

    const ErroringBitstamp = proxyquire(dirs.exchanges + 'bitstamp', spoofer);
    const ebs = new ErroringBitstamp(config.watch);

    ebs.retry = _.noop;
    const retrySpy = sinon.spy(ebs, 'retry');

    ebs.getTrades(null, _.noop);

    expect(retrySpy.callCount).to.equal(1);

    const args = retrySpy.lastCall.args;
    expect(args[1].length).to.equal(2);
    expect(args[1][0]).to.equal(null);
  });

  it('should correctly parse historical trades', function(done) {
    const check = function(err, trades) {

      expect(err).to.equal(null);

      expect(trades.length).to.equal(TRADES.length);

      const oldest = _.first(trades);
      const OLDEST = _.last(TRADES);

      expect(oldest.tid).to.equal(+OLDEST.tid);
      expect(oldest.price).to.equal(+OLDEST.price);
      expect(oldest.amount).to.equal(+OLDEST.amount);
      expect(oldest.date).to.equal(OLDEST.date);

      done();
    };

    bs.getTrades(null, check, false);

  });
});
