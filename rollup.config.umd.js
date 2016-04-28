import config from './rollup.config';

config.format = 'umd';
config.dest = 'dist/localforage-observable.js';
config.moduleName = 'localforageObservable';

export default config;
