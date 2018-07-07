const path = require('path');
const packageJSON = require('./package.json');
const getKarmaConfig = require('resin-config-karma');

const LF_MODULE_PATH = './node_modules/localforage';
const LF_BROWSER_BUNDLE = path.join(
  LF_MODULE_PATH,
  require(`${LF_MODULE_PATH}/package.json`).main,
);
const ZEN_OBSERVABLE_BROWSER_BUNDLE = './node_modules/zen-observable/zen-observable.js';
const BROWSER_BUNDLE = packageJSON.main;

module.exports = (config) => {
  const karmaConfig = getKarmaConfig(packageJSON);
  karmaConfig.webpack.node = {
    global: true,
    fs: 'empty',
    dns: 'empty',
    net: 'empty',
    process: 'mock',
  };
  karmaConfig.files = [
    LF_BROWSER_BUNDLE,
    ZEN_OBSERVABLE_BROWSER_BUNDLE,
    BROWSER_BUNDLE,
    'build/test-e2e/**/*.spec.js',
  ];
  config.set(karmaConfig);
};
