const mongojs = require('mongojs');
const mongoUtil = require('./util');

const util = require('../../core/util.js');
const config = util.getConfig();
const dirs = util.dirs();

// verify the correct dependencies are installed
const pluginHelper = require(`${dirs.core}pluginUtil`);
const pluginMock = {
  slug: 'mongodb adapter',
  dependencies: config.mongodb.dependencies,
};

// exit if plugin couldn't be loaded
const cannotLoad = pluginHelper.cannotLoad(pluginMock);
if (cannotLoad) {
  util.die(cannotLoad);
}

const mode = util.gekkoMode();

const collections = [
  mongoUtil.settings.historyCollection,
  mongoUtil.settings.adviceCollection,
];

const connection = mongojs(config.mongodb.connectionString, collections);
const collection = connection.collection(mongoUtil.settings.historyCollection);

if (mode === 'backtest') {
  const pair = mongoUtil.settings.pair.join('_');

  collection.find({ pair }).toArray((err, docs) => { // check if we've got any records
    if (err) {
      util.die(err);
    }
    if (docs.length === 0) {
      util.die(`History table for ${config.watch.exchange} with pair ${pair} is empty.`);
    }
  })
}

if(mongoUtil.settings.exchange) {
    collection.createIndex({start: 1, pair: 1}, {unique: true}); // create unique index on "time" and "pair"
}
module.exports = connection;
