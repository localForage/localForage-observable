import typescript from 'rollup-plugin-typescript';
let pkg = require('./package.json');

export default {
    input: 'lib/index.ts',
    plugins: [
        typescript({
            tsconfig: false,
            typescript: require('typescript'),
            allowSyntheticDefaultImports: true,
            module: 'es2015',
            target: 'es3',
            declaration: false,
            noImplicitAny: true,
            preserveConstEnums: true,
            removeComments: true,
            sourceMap: true,
            strictNullChecks: true
        }),
    ],
    external: ['localforage'],
    output: [
        {
            file: pkg.main,
            format: 'umd',
            globals: {
                localforage: 'localforage'
            },
            name: pkg.name.replace(/-([a-z])/g, g => g[1].toUpperCase()),
            // sourceMap: true
        },
    ],
};
