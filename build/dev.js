const chalk = require('chalk');
const webpack = require('webpack');
const getEnv = require('./config/getEnv');
const webpackConfig = require('./webpack.config');

const ENV = getEnv();

module.exports = (opts) => {
  const compiler = webpack(
    webpackConfig(
      {
        mode: ENV.DEV,
        devtool: 'cheap-module-source-map',
      },
      opts || {},
    ),
  );

  compiler.watch({}, (err, stats) => {
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
