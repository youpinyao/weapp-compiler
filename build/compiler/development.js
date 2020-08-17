const chalk = require('chalk');
const fse = require('fs-extra');
const watch = require('watch');
const dayjs = require('dayjs');
const getConfig = require('../utils/config');
const copyModuleSync = require('../utils/module');
const copy = require('../utils/copy');
const { clearConsole, clearOutput } = require('../utils/clear');

module.exports = () => {
  const config = getConfig();
  const convertToOutput = (file) => file.replace(config.context, config.output);

  clearOutput(config.output);
  copyModuleSync(config.output);

  watch.watchTree(
    config.context,
    {
      interval: 0.5,
    },
    async function (files, curr, prev) {
      const date = +new Date();

      clearConsole();
      console.log('[weapp]', chalk.yellow(dayjs().format('YYYY-MM-DD HH:mm:ss')));
      if (typeof files == 'object' && prev === null && curr === null) {
        // Finished walking the tree
        // console.log(f, 'Finished walking the tree');

        const promises = [];
        let count = 0;
        const copySync = async (from, to) => {
          await copy(from, to);
          count++;
        };

        Object.keys(files).forEach((file) => {
          if (fse.statSync(file).isFile()) {
            promises.push(copySync(file, convertToOutput(file)));
          }
        });

        Promise.all(promises).then(() => {
          console.log('[weapp]', '文件总数：', chalk.green(count));
          console.log('[weapp]', '耗时：', chalk.green(`${+new Date() - date}ms`));
        });
      } else if (prev === null) {
        // f is a new file
        await copy(files, convertToOutput(files));
        console.log('[weapp]', '新增文件：', chalk.green(files));
        console.log('[weapp]', '耗时：', chalk.green(`${+new Date() - date}ms`));
      } else if (curr.nlink === 0) {
        // f was removed
        fse.removeSync(convertToOutput(files));
        console.log('[weapp]', '删除文件：', chalk.green(files));
        console.log('[weapp]', '耗时：', chalk.green(`${+new Date() - date}ms`));
      } else {
        // f was changed
        await copy(files, convertToOutput(files));
        console.log('[weapp]', '更改文件：', chalk.green(files));
        console.log('[weapp]', '耗时：', chalk.green(`${+new Date() - date}ms`));
      }
    },
  );
};
