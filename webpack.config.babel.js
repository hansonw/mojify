import path from 'path';
import webpack from 'webpack';
import LiveReloadPlugin from 'webpack-livereload-plugin';

const BUILD_DEV = process.argv.indexOf('-d') !== -1;

const plugins = [
  new webpack.DefinePlugin({
    __DEV__: JSON.stringify(JSON.parse(BUILD_DEV)),
    'process.env': {
      NODE_ENV: BUILD_DEV ? undefined : JSON.stringify('production'),
    },
  }),
];

if (BUILD_DEV) {
  plugins.push(new LiveReloadPlugin());
} else {
  plugins.push(new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: false,
    },
  }));
}

export default {
  cache: true,
  entry: {
    popup: './lib/popup.js',
    content: './lib/content.js',
    background: './lib/background.js',
    worker: './lib/worker.js',
  },
  output: {
    path: 'build',
    filename: '[name].js',
  },
  module: {
    loaders: [
      {
        loader: 'babel-loader',
        test: /\.js$/,
        include: [
          path.resolve(__dirname, 'lib'),
        ],
      },
      {
        loader: 'style-loader!css-loader',
        test: /\.css$/,
      },
      // font-awesome
      // {
      //   test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      //   loader: 'url-loader?limit=10000&minetype=application/font-woff',
      // },
      // { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'file-loader' },
    ],
  },
  plugins,
};
