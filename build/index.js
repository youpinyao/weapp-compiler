// const chalk = require('chalk');
const webpack = require('webpack');
const isError = require('./utils/error');
const fse = require('fs-extra');
const path = require('path');
const args = process.argv;
const type = args[2];
const config = {
  dev: require('./webpack.config.dev'),
  build: require('./webpack.config'),
}[type];

if (fse.existsSync(config.output.path)) {
  fse.readdirSync(config.output.path).forEach((file) => {
    fse.removeSync(path.resolve(config.output.path, file));
  });
}
console.log('[weapp]', `${config.output.path} 删除成功`);

if (type === 'dev') {
  webpack(config).watch(config.watchOptions, (err, stats) => {
    if (!isError(err, stats)) {
      // console.log(chalk.green('\r\nbuild complete \r\n'));
    }
  });
} else {
  webpack(config).run((err, stats) => {
    if (!isError(err, stats)) {
      console.log('[weapp]', '构建完成');
    }
  });
}
