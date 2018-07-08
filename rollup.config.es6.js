import typescript from 'rollup-plugin-typescript2';
let pkg = require('./package.json');

export default {
    input: 'lib/index.ts',
    plugins: [typescript()],
    external: ['localforage'],
    output: [
        {
            file: pkg['jsnext:main'],
            format: 'es',
            // sourceMap: true
        },
    ],
};
