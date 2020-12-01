const chalk = require('chalk');
const ProgressBar = require('progress');
const copy = require('./copy');
const getConfig = require('../utils/config');
const { clearConsole } = require('../utils/clear');

module.exports = async (files, prefix = '[src]') => {
  clearConsole();

  let count = 0;
  const config = getConfig();
  const date = +new Date();
  const convertToOutput = (file) => file.replace(config.context, config.output);
  const copySync = async (from, to) => {
    await copy(from, to);
    count++;
    bar.tick({
      from,
    });
  };
  const bar = new ProgressBar(
    `[weapp] ${chalk.yellow(`${prefix} [:bar] :current/:total [:from]`)}`,
    {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: files.length,
    },
  );

  for (let i = 0; i < files.length; i++) {
    let from;
    let to;

    if (typeof files[i] === 'object') {
      from = files[i].from;
      to = files[i].to;
    } else {
      from = files[i];
      to = convertToOutput(files[i]);
    }

    // 过滤忽略文件路径
    if (config.ignore.map((item) => to.indexOf(item)).filter((item) => item === 0).length) {
      continue;
    }
    if (
      config.ignoreExpression.map((item) => new RegExp(item, 'g').test(to)).filter((item) => !!item)
        .length
    ) {
      continue;
    }
    try {
      await copySync(from, to);
    } catch (error) {
      console.error(error);
      process.exit();
    }
  }
  console.log('');
  console.log('[weapp]', '文件总数：', chalk.green(count));
  console.log('[weapp]', '耗时：', chalk.green(`${+new Date() - date}ms`));
};
