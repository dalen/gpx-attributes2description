const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './main.js',
  node: {
    __dirname: false,
    __filename: false,
  },
  target: 'electron',
  externals: [nodeExternals()],
  output: {
    filename: 'build.js',
  },
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader',
      query: {
        plugins: [
          'babel-plugin-transform-es2015-modules-commonjs',
          'babel-plugin-transform-class-properties',
        ],
      },
    }],
  },
};
