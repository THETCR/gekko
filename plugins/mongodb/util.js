const config = require('../../core/util.js').getConfig();

let watch = config.watch;
const exchangeLowerCase = watch ? watch.exchange.toLowerCase() : watch = {}; // Do not crash on this, not needed to read from db

const settings = {
  exchange: watch.exchange,
  pair: [watch.currency, watch.asset],
  historyCollection: `${exchangeLowerCase}_candles`,
  adviceCollection: `${exchangeLowerCase}_advices`,
};

module.exports = {
  settings
};
