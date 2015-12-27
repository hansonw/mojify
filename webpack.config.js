var webpack = require('webpack');
var LiveReloadPlugin = require('webpack-livereload-plugin');

module.exports = {
  cache: true,
  entry: {
    popup: './lib/popup.js',
    content: './lib/content.js',
  },
  output: {
    path: 'build',
    filename: '[name].js'
  },
  module: {
    loaders: [
      { test: /\.js$/ , loader: 'babel' },
      { test: /\.css$/, loader: 'style-loader!css-loader' },
      // font-awesome
      // { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'url-loader?limit=10000&minetype=application/font-woff' },
      // { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'file-loader' }
    ]
  },
  plugins: [
    new LiveReloadPlugin()
  ]
};
