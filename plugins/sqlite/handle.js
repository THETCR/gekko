const _ = require('lodash');
const fs = require('fs');

const util = require('../../core/util.js');

const config = util.getConfig();
const dirs = util.dirs();

const adapter = config.sqlite;

// verify the correct dependencies are installed
const pluginHelper = require(dirs.core + 'pluginUtil');
const pluginMock = {
  slug: 'sqlite adapter',
  dependencies: adapter.dependencies,
};

const cannotLoad = pluginHelper.cannotLoad(pluginMock);
if (cannotLoad) util.die(cannotLoad);

// should be good now
let sqlite3;
if (config.debug) {
  sqlite3 = require('sqlite3').verbose();
} else {
  sqlite3 = require('sqlite3');
}

const plugins = require(util.dirs().gekko + 'plugins');

const version = adapter.version;

const dbName = config.watch.exchange.toLowerCase() + '_' + version + '.db';
const dir = dirs.gekko + adapter.dataDirectory;

const fullPath = [dir, dbName].join('/');

const mode = util.gekkoMode();
if (mode === 'realtime' || mode === 'importer') {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
} else if (mode === 'backtest') {
  if (!fs.existsSync(dir)) util.die('History directory does not exist.');

  if (!fs.existsSync(fullPath))
    util.die(
      `History database does not exist for exchange ${
        config.watch.exchange
        } at version ${version}.`
    );
}

module.exports = {
  initDB: () => {
    const journalMode = config.sqlite.journalMode || 'PERSIST';
    const syncMode = journalMode === 'WAL' ? 'NORMAL' : 'FULL';

    const db = new sqlite3.Database(fullPath);
    db.run('PRAGMA synchronous = ' + syncMode);
    db.run('PRAGMA journal_mode = ' + journalMode);
    db.configure('busyTimeout', 10000);
    return db;
  }
};
