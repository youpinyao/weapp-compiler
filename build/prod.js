const webpack = require('webpack');
const record = require('./record');
const webpackConfig = require('./webpack.config');

module.exports = (opts) => {
  const compiler = webpack(
    webpackConfig(
      {
        mode: 'production',
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

    record({
      env: 'production',
    });

    console.log(
      stats.toString({
        chunks: false, // Makes the build much quieter
        colors: true, // Shows colors in the console
      }),
    );
  });
};
