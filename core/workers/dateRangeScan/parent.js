const ForkTask = require('relieve').tasks.ForkTask;
const fork = require('child_process').fork;

module.exports = function(config, done) {
  const debug = typeof v8debug === 'object';
  if (debug) {
    process.execArgv = [];
  }

  task = new ForkTask(fork(__dirname + '/child'));

  task.send('start', config);

  task.once('ranges', ranges => {
    return done(false, ranges);
  });
  task.on('exit', code => {
    if(code !== 0)
      done('ERROR, unable to scan dateranges, please check the console.');
  });
};
