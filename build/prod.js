const chalk = require('chalk');
const webpack = require('webpack');
const ENV = require('./config/env');
const webpackConfig = require('./webpack.config');

module.exports = (opts) => {
  const compiler = webpack(
    webpackConfig(
      {
        mode: ENV.PROD,
        devtool: 'source-map',
      },
      opts || {},
    ),
  );

  compiler.run((err, stats) => {
    if (err) {
      console.error(err);
      return;
    }

    if (stats.hasErrors()) {
      console.log(
        stats.toString({
          chunks: false, // Makes the build much quieter
          colors: true, // Shows colors in the console
        }),
      );
    }

    console.log(chalk.green(`completed in ${(stats.endTime - stats.startTime) / 1000} seconds`));
  });
};
