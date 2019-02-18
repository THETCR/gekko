/**
 * Created by billymcintosh on 24/12/17.
 */
const _ = require('lodash');
const request = require('request');
const log = require('../core/log.js');
const util = require('../core/util.js');

const config = util.getConfig();
const kodiConfig = config.kodi;

const Kodi = function (done) {
  _.bindAll(this);

  this.exchange = config.watch.exchange.charAt().toUpperCase() + config.watch.exchange.slice(1);

  this.price = 'N/A';
  this.done = done;
  this.setup();
};

Kodi.prototype.setup = function (done) {
  const setupKodi = function (err, result) {
    if (kodiConfig.sendMessageOnStart) {
      const currency = config.watch.currency;
      const asset = config.watch.asset;
      const title = 'Gekko Started';
      const message = `Watching ${this.exchange} - ${currency}/${asset}`;
      this.mail(title, message);
    } else {
      log.debug('Skipping Send message on startup');
    }
  };
  setupKodi.call(this)
};

Kodi.prototype.processCandle = function (candle, done) {
  this.price = candle.close;

  done();
};

Kodi.prototype.processAdvice = function (advice) {
  const title = `Gekko: Going ${advice.recommendation} @ ${this.price}`;
  const message = `${this.exchange} ${config.watch.currency}/${config.watch.asset}`;
  this.mail(title, message);
};

Kodi.prototype.mail = function (title, message, done) {
  const options = {
    body: `{"jsonrpc":"2.0","method":"GUI.ShowNotification","params":{"title":"${title}","message":"${message}"},"id":1}`,
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    url: kodiConfig.host,
  };

  request(options, (error, response, body) => {
    if (!error) {
      log.info('Kodi message sent')
    } else {
      log.debug(`Kodi ${error}`)
    }
  })
};

module.exports = Kodi;
