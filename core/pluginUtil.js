const _ = require('lodash');
const async = require('async');
const Emitter = require('./emitter');

const util = require(__dirname + '/util');

const log = require(util.dirs().core + 'log');

const config = util.getConfig();
const pluginDir = util.dirs().plugins;
const gekkoMode = util.gekkoMode();
const inherits = require('util').inherits;

const pluginHelper = {
  // Checks whether we can load a module

  // @param Object plugin
  //    plugin config object
  // @return String
  //    error message if we can't
  //    use the module.
  cannotLoad: function(plugin) {

    // verify plugin dependencies are installed
    let error;
    if (_.has(plugin, 'dependencies'))
      error = false;

    _.each(plugin.dependencies, function(dep) {
      try {
        const a = require(dep.module);
      } catch (e) {
        log.error('ERROR LOADING DEPENDENCY', dep.module);

        if (!e.message) {
          log.error(e);
          util.die();
        }

        if (!e.message.startsWith('Cannot find module'))
          return util.die(e);

         error = [
          'The plugin',
          plugin.slug,
          'expects the module',
          dep.module,
          'to be installed.',
          'However it is not, install',
          'it by running: \n\n',
          '\tnpm install',
          dep.module + '@' + dep.version,
        ].join(' ');
      }
    });

    return error;
  },
  // loads a plugin
  //
  // @param Object plugin
  //    plugin config object
  // @param Function next
  //    callback
  load: function(plugin, next) {

    plugin.config = config[plugin.slug];

    if (!plugin.config || !plugin.config.enabled)
      return next();

    if (!_.contains(plugin.modes, gekkoMode)) {
      log.warn(
        'The plugin',
        plugin.name,
        'does not support the mode',
        gekkoMode + '.',
        'It has been disabled.',
      );
      return next();
    }

    log.info('Setting up:');
    log.info('\t', plugin.name);
    log.info('\t', plugin.description);

    const cannotLoad = pluginHelper.cannotLoad(plugin);
    if (cannotLoad)
      return next(cannotLoad);

    let Constructor;
    if (plugin.path)
      Constructor = require(pluginDir + plugin.path(config));
    else
      Constructor = require(pluginDir + plugin.slug);

    let instance;
    if (plugin.async) {
      inherits(Constructor, Emitter);
      instance = new Constructor(util.defer(function(err) {
        next(err, instance);
      }), plugin);
      Emitter.call(instance);

      instance.meta = plugin;
    } else {
      inherits(Constructor, Emitter);
      instance = new Constructor(plugin);
      Emitter.call(instance);

      instance.meta = plugin;
      _.defer(function() {
        next(null, instance);
      });
    }

    if (!plugin.silent)
      log.info('\n');
  },
};

module.exports = pluginHelper;
