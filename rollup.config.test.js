import typescript from 'rollup-plugin-typescript2';
import multiEntry from 'rollup-plugin-multi-entry';

export default {
  input: 'test/**/*_test.js',
  plugins: [typescript(), multiEntry()],
  output: [
    {
      intro: 'require("source-map-support").install();',
      file: 'build/test-bundle.js',
      format: 'cjs',
      sourceMap: true
    }
  ]
};
