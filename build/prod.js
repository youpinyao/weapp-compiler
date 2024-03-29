const chalk = require('chalk');
const webpack = require('webpack');
const ENV = require('./config/env');
const webpackConfig = require('./webpack.config');

module.exports = (opts) => {
  const compiler = webpack(
    webpackConfig(
      {
        mode: ENV.PROD,
        devtool: opts.sourceMap ? 'source-map' : false,
      },
      opts || {},
    ),
  );

  compiler.run((err, stats) => {
    if (err) {
      throw new Error(err);
    }

    if (stats.hasErrors()) {
      throw new Error(
        stats.toString({
          chunks: false, // Makes the build much quieter
          colors: true, // Shows colors in the console
        }),
      );
    }

    console.log(chalk.green(`completed in ${(stats.endTime - stats.startTime) / 1000} seconds`));
  });
};
