import typescript from 'rollup-plugin-typescript';
import multiEntry from 'rollup-plugin-multi-entry';

export default {
  input: './test/**/*_test.ts',
  plugins: [typescript({
    tsconfig: 'test/tsconfig.json',
    typescript: require('typescript'),
  }), multiEntry()],
  external: ['localforage'],
  output: [
    {
      intro: 'require("source-map-support").install();',
      file: 'build/test/test-bundle.js',
      format: 'cjs',
      sourceMap: true
    }
  ]
};
