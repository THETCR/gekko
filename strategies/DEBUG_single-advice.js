const settings = {
  wait: 0,
  // advice: 'short'
  advice: 'long',
};

// -------

const _ = require('lodash');
const log = require('../core/log.js');

let i = 0;

const method = {
  init: _.noop,
  update: _.noop,
  log: _.noop,
  check: function () {

    // log.info('iteration:', i);
    if (settings.wait === i) {
      console.log('trigger advice!');
      this.advice({
        direction: settings.advice,
        trigger: {
          type: 'trailingStop',
          trailPercentage: 0.5,
        },
      });
    }

    i++;

  },
};

module.exports = method;
