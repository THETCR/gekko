// overwrite config with test-config

const utils = require(__dirname + '/../core/util');
const testConfig = require(__dirname + '/test-config.json');
utils.setConfig(testConfig);
