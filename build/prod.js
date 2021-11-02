const webpack = require('webpack');
const getEnv = require('./config/getEnv');
const recordEnv = require('./utils/recordEnv');
const webpackConfig = require('./webpack.config');

const ENV = getEnv();

module.exports = (opts) => {
  const compiler = webpack(
    webpackConfig(
      {
        mode: ENV.PROD,
        devtool: 'cheap-module-source-map',
      },
      opts || {},
    ),
  );

  compiler.run((err, stats) => {
    if (err) {
      console.error(err);
      return;
    }

    recordEnv({
      env: ENV.PROD,
    });

    console.log(
      stats.toString({
        chunks: false, // Makes the build much quieter
        colors: true, // Shows colors in the console
      }),
    );
  });
};
