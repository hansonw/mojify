var webpack = require('webpack');
var LiveReloadPlugin = require('webpack-livereload-plugin');

var BUILD_DEV = !!process.env.BUILD_DEV;
var definePlugin = new webpack.DefinePlugin({
  __DEV__: JSON.stringify(JSON.parse(BUILD_DEV)),
  "process.env": {
    NODE_ENV: BUILD_DEV ? undefined : JSON.stringify("production")
  }
});

var plugins = [
  definePlugin,
];

if (BUILD_DEV) {
  plugins.push(new LiveReloadPlugin());
} else {
  plugins.push(new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: false
    }
  }));
}

module.exports = {
  cache: true,
  entry: {
    popup: './lib/popup.js',
    content: './lib/content.js',
    background: './lib/background.js',
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
  plugins: plugins
};
