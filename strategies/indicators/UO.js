// required indicators
const SMA = require('./SMA.js');

const Indicator = function (settings) {
  this.input = 'candle';
  this.lastClose = 0;
  this.uo = 0;
  this.firstWeight = settings.first.weight;
  this.secondWeight = settings.second.weight;
  this.thirdWeight = settings.third.weight;
  this.firstLow = new SMA(settings.first.period);
  this.firstHigh = new SMA(settings.first.period);
  this.secondLow = new SMA(settings.second.period);
  this.secondHigh = new SMA(settings.second.period);
  this.thirdLow = new SMA(settings.third.period);
  this.thirdHigh = new SMA(settings.third.period);
};

Indicator.prototype.update = function (candle) {
  const close = candle.close;
  const prevClose = this.lastClose;
  const low = candle.low;
  const high = candle.high;

  const bp = close - Math.min(low, prevClose);
  const tr = Math.max(high, prevClose) - Math.min(low, prevClose);

  this.firstLow.update(tr);
  this.secondLow.update(tr);
  this.thirdLow.update(tr);

  this.firstHigh.update(bp);
  this.secondHigh.update(bp);
  this.thirdHigh.update(bp);

  const first = this.firstHigh.result / this.firstLow.result;
  const second = this.secondHigh.result / this.secondLow.result;
  const third = this.thirdHigh.result / this.thirdLow.result;

  this.uo = 100 * (this.firstWeight * first + this.secondWeight * second + this.thirdWeight * third) / (this.firstWeight + this.secondWeight + this.thirdWeight);

  this.lastClose = close;
};

module.exports = Indicator;
