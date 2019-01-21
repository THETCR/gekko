const chai = require('chai');
const expect = chai.expect;
const should = chai.should;
const sinon = require('sinon');

const _ = require('lodash');

const util = require('../../core/util');
const dirs = util.dirs();
const INDICATOR_PATH = dirs.indicators;

const prices = [81, 24, 75, 21, 34, 25, 72, 92, 99, 2, 86, 80, 76, 8, 87, 75, 32, 65, 41, 9, 13, 26, 56, 28, 65, 58, 17, 90, 87, 86, 99, 3, 70, 1, 27, 9, 92, 68, 9];

describe('indicators/SMA', function() {

  const SMA = require(INDICATOR_PATH + 'SMA');

  const verified_SMA10results = [81, 52.5, 60, 50.25, 47, 43.333333333333336, 47.42857142857143, 53, 58.111111111111114, 52.5, 53, 58.6, 58.7, 57.4, 62.7, 67.7, 63.7, 61, 55.2, 55.9, 48.6, 43.2, 41.2, 43.2, 41, 39.3, 37.8, 40.3, 44.9, 52.6, 61.2, 58.9, 60.3, 57.6, 53.8, 48.9, 56.4, 54.2, 46.4];
  const verified_SMA12results = [81, 52.5, 60, 50.25, 47, 43.333333333333336, 47.42857142857143, 53, 58.111111111111114, 52.5, 55.54545454545455, 57.583333333333336, 57.166666666666664, 55.833333333333336, 56.833333333333336, 61.333333333333336, 61.166666666666664, 64.5, 61.916666666666664, 55, 47.833333333333336, 49.833333333333336, 47.333333333333336, 43, 42.083333333333336, 46.25, 40.416666666666664, 41.666666666666664, 46.25, 48, 52.833333333333336, 52.333333333333336, 57.083333333333336, 55, 52.583333333333336, 51, 53.25, 54.083333333333336, 53.416666666666664];
  const verified_SMA26results = [81, 52.5, 60, 50.25, 47, 43.333333333333336, 47.42857142857143, 53, 58.111111111111114, 52.5, 55.54545454545455, 57.583333333333336, 59, 55.357142857142854, 57.46666666666667, 58.5625, 57, 57.44444444444444, 56.578947368421055, 54.2, 52.23809523809524, 51.04545454545455, 51.26086956521739, 50.291666666666664, 50.88, 51.15384615384615, 48.69230769230769, 51.23076923076923, 51.69230769230769, 54.19230769230769, 56.69230769230769, 55.84615384615385, 55.76923076923077, 52.26923076923077, 49.5, 49.76923076923077, 50, 49.53846153846154, 46.96153846153846];

  it('should correctly calculate SMAs with window length 10', function() {
    const sma = new SMA(10);
    _.each(prices, function(p, i) {
      sma.update(p);
      expect(sma.result).to.equal(verified_SMA10results[i]);
    });
  });

  it('should correctly calculate SMAs with window length 12', function() {
    const sma = new SMA(12);
    _.each(prices, function(p, i) {
      sma.update(p);
      expect(sma.result).to.equal(verified_SMA12results[i]);
    });
  });

  it('should correctly calculate SMAs with window length 26', function() {
    const sma = new SMA(26);
    _.each(prices, function(p, i) {
      sma.update(p);
      expect(sma.result).to.equal(verified_SMA26results[i]);
    });
  });

});
