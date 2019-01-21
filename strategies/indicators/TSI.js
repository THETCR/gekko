// required indicators
const EMA = require('./EMA.js');

const Indicator = function(settings) {
  this.input = 'candle';
  this.lastClose = null;
  this.tsi = 0;
  this.inner = new EMA(settings.long);
  this.outer = new EMA(settings.short);
  this.absoluteInner = new EMA(settings.long);
  this.absoluteOuter = new EMA(settings.short);
};

Indicator.prototype.update = function(candle) {
  const close = candle.close;
  const prevClose = this.lastClose;

  if (prevClose === null) {
    // Set initial price to prevent invalid change calculation
    this.lastClose = close;
    // Do not calculate TSI on first close
    return;
  }

  const momentum = close - prevClose;

  this.inner.update(momentum);
  this.outer.update(this.inner.result);

  this.absoluteInner.update(Math.abs(momentum));
  this.absoluteOuter.update(this.absoluteInner.result);

  this.tsi = 100 * this.outer.result / this.absoluteOuter.result;

  this.lastClose = close;
};

module.exports = Indicator;
