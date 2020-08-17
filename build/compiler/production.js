const chalk = require('chalk');
const copy = require('../utils/copy');
const copyModuleSync = require('../utils/module');
const getConfig = require('../utils/config');
const { clearOutput } = require('../utils/clear');
const getFiles = require('../utils/files');

module.exports = () => {
  const promises = [];
  let count = 0;
  const config = getConfig();
  const date = +new Date();
  const convertToOutput = (file) => file.replace(config.context, config.output);
  const copySync = async (from, to) => {
    await copy(from, to);
    count++;
  };

  clearOutput(config.output);
  copyModuleSync(config.output);

  getFiles(config.context).forEach((file) => {
    promises.push(copySync(file, convertToOutput(file)));
  });

  Promise.all(promises).then(() => {
    console.log('[weapp]', '文件总数：', chalk.green(count));
    console.log('[weapp]', '耗时：', chalk.green(`${+new Date() - date}ms`));
  });
};
