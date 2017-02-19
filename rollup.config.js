import babel from 'rollup-plugin-babel';
import babelrc from 'babelrc-rollup';

export default {
  entry: 'lib/localforageObservable.js',
  // sourceMap: true,
  plugins: [babel(babelrc())]
};
