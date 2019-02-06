const chai = require('chai');
const expect = chai.expect;
const should = chai.should;
const assert = chai.assert;
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const _ = require('lodash');
const moment = require('moment');

const util = require(__dirname + '/../core/util');
const config = util.getConfig();
const dirs = util.dirs();

const providerName = config.watch.exchange.toLowerCase();
const providerPath = util.dirs().gekko + 'exchanges/' + providerName;

return; // TEMP

let mf;

const spoofer = {};

const TRADES = [
  { tid: 1, amount: 1, price: 100, date: 1475837937 },
  { tid: 2, amount: 1, price: 100, date: 1475837938 },
];

// stub the exchange
const FakeProvider = function () {
};
const getTrades = function (since, handler, descending) {
  handler(
    null,
    TRADES,
  );
};
FakeProvider.prototype = {
  getTrades: getTrades
};

spoofer[providerPath] = FakeProvider;
const getTradesSpy = sinon.spy(FakeProvider.prototype, 'getTrades');

// stub the tradebatcher
const TradeBatcher = require(util.dirs().budfox + 'tradeBatcher');
const tradeBatcherSpy = sinon.spy(TradeBatcher.prototype, 'write');
spoofer[util.dirs().budfox + 'tradeBatcher'] = TradeBatcher;

const MarketFetcher = proxyquire(dirs.budfox + 'marketFetcher', spoofer);

describe('budfox/marketFetcher', function () {
  it('should throw when not passed a config', function () {
    expect(function () {
      new MarketFetcher();
    }).to.throw('TradeFetcher expects a config');
  });

  it('should instantiate', function () {
    mf = new MarketFetcher(config);
  });

  it('should fetch with correct arguments', function () {

    // mf.fetch should call the DataProvider like:
    // provider.getTrades(since, callback, descending)

    mf.fetch();
    expect(getTradesSpy.callCount).to.equal(1);

    const args = getTradesSpy.firstCall.args;

    // test-config uses NO `tradingAdvisor`
    const since = args[0];
    expect(since).to.equal(undefined);

    const handler = args[1];
    assert.isFunction(handler);

    const descending = args[2];
    expect(descending).to.equal(false);
  });

  xit('should retry on error', function () {
    // todo
  });

  it('should pass the data to the tradebatcher', function () {
    mf.fetch();
    expect(getTradesSpy.callCount).to.equal(2);

    expect(tradeBatcherSpy.lastCall.args[0]).to.deep.equal(TRADES);
  });

  xit('should relay trades', function () {
    // todo
  });

});
