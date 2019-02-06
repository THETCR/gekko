const start = (config, candleSize, daterange) => {
  const util = require(__dirname + '/../../util');

  // force correct gekko env
  util.setGekkoEnv('child-process');

  // force disable debug
  config.debug = false;
  util.setConfig(config);

  const dirs = util.dirs();

  const load = require(dirs.tools + 'candleLoader');
  load(config.candleSize, candles => {
    process.send(candles);
  });
};

process.send('ready');

process.on('message', (m) => {
  if (m.what === 'start')
    start(m.config, m.candleSize, m.daterange);
});

process.on('disconnect', function () {
  process.exit(0);
});
