const path = require('path');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const WeappPlugin = require('./weapp.plugin');
const config = require('./utils/config')();

module.exports = {
  entry: path.resolve(process.cwd(), config.context, 'app.json'),
  output: {
    filename: 'main.js',
    path: path.resolve(process.cwd(), config.output),
  },
  context: path.resolve(process.cwd(), config.context),
  plugins: [
    new WeappPlugin(),
    new ProgressBarPlugin({
      summary: false,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif|wxss|wxs|wxml|js|json)$/i,
        use: [
          {
            loader: path.resolve(__dirname, 'weapp-loader'),
          },
        ],
      },
    ],
  },
};
