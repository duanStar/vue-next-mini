const resolve = require('@rollup/plugin-node-resolve')
const commonjs = require('@rollup/plugin-commonjs')
const typescript = require('@rollup/plugin-typescript')

module.exports = [
  {
    input: 'packages/vue/src/index.ts',
    output: [
      {
        file: './packages/vue/dist/vue.js',
        format: 'iife',
        sourcemap: true,
        name: 'Vue'
      },
      {
        file: './packages/vue/dist/vue.cjs.js',
        format: 'cjs',
        sourcemap: true,
        name: 'Vue'
      },
      {
        file: './packages/vue/dist/vue.esm.js',
        format: 'esm',
        sourcemap: true,
        name: 'Vue'
      }
    ],
    plugins: [
      typescript({
        sourceMap: true
      }),
      resolve(),
      commonjs()
    ]
  }
]
