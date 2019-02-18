// helpers
// const _ = require('lodash');
const log = require('../core/log');

// configuration
const config = require('../core/util').getConfig();

const settings = config.varPPO;
const momentum = settings.momentum;
const momentumName = momentum.toLowerCase();
const momentumSettings = config[momentum];

// let's create our own method
const method = {};

// prepare everything our method needs
method.init = function () {
  this.trend = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false
  };

  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('ppo', 'PPO', config.PPO);
  this.addIndicator(momentumName, momentum, momentumSettings);
};

// what happens on every new candle?
method.update = function (candle) {
  // nothing!
};

// for debugging purposes log the last
// calculated parameters.
method.log = function (candle) {
  const digits = 8;
  const ppo = this.indicators.ppo.result;
  const result = ppo.ppo;
  const signal = ppo.PPOsignal;
  const hist = ppo.PPOhist;
  const momentumResult = this.indicators[momentumName][momentumName];

  log.debug('\t', 'PPO:', result.toFixed(digits));
  log.debug('\t', 'PPOsignal:', signal.toFixed(digits));
  log.debug('\t', 'PPOhist:', hist.toFixed(digits));
  log.debug('\t', momentum + ':', momentumResult.toFixed(digits));
  log.debug('\t', 'price:', candle.close.toFixed(digits));
};

method.check = function () {
  const ppo = this.indicators.ppo.result;
  const hist = ppo.PPOhist;

  const value = this.indicators[momentumName][momentumName];

  const thresholds = {
    low: momentumSettings.thresholds.low + hist * settings.thresholds.weightLow,
    high: momentumSettings.thresholds.high + hist * settings.thresholds.weightHigh,
  };

  if (value < thresholds.low) {

    // new trend detected
    if (this.trend.direction !== 'up')
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'up',
        adviced: false
      };

    this.trend.duration++;

    log.debug('In uptrend since', this.trend.duration, 'candle(s)');

    if (this.trend.duration >= settings.thresholds.persistence)
      this.trend.persisted = true;

    if (this.trend.persisted && !this.trend.adviced) {
      this.trend.adviced = true;
      this.advice('long');
    } else
      this.advice();

  } else if (value > thresholds.high) {

    // new trend detected
    if (this.trend.direction !== 'down')
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'down',
        adviced: false
      };

    this.trend.duration++;

    log.debug('In downtrend since', this.trend.duration, 'candle(s)');

    if (this.trend.duration >= settings.thresholds.persistence)
      this.trend.persisted = true;

    if (this.trend.persisted && !this.trend.adviced) {
      this.trend.adviced = true;
      this.advice('short');
    } else
      this.advice();


  } else {

    log.debug('In no trend');

    // we're not in an up nor in a downtrend
    // but for now we ignore sideways trends
    //
    // read more @link:
    //
    // https://github.com/askmike/gekko/issues/171

    // this.trend = {
    //   direction: 'none',
    //   duration: 0,
    //   persisted: false,
    //   adviced: false
    // };

    this.advice();
  }

};

module.exports = method;
