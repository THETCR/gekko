const config = require('../../core/util.js').getConfig();

const watch = config.watch;
const settings = {
  exchange: watch.exchange,
  pair: [watch.currency, watch.asset],
  historyPath: config.sqlite.dataDirectory,
};

module.exports = {
  settings: settings,
  table: function(name) {
    return [name, settings.pair.join('_')].join('_');
  }
};
