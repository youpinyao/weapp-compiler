const chalk = require('chalk');
const fse = require('fs-extra');
const watch = require('watch');
const getFiles = require('../utils/files');
const getConfig = require('../utils/config');
const moduleSync = require('./module');
const copy = require('../utils/copy');
const { clearConsole } = require('../utils/clear');
const compiler = require('./compiler');

module.exports = async () => {
  const config = getConfig();
  const convertToOutput = (file) =>
    file.replace(config.context, config.output).replace(/(\.(less|scss))$/g, '.wxss');

  const convertToContext = (file) => file.replace(config.output, config.context);
  const compilerCss = async (file) => {
    if (/(\.(less|scss))$/g.test(file)) {
      await compiler(getFiles(config.context).filter((item) => /(\.(less|scss))$/g.test(item)));
    } else {
      clearConsole();
    }
  };

  // clearOutput();
  await moduleSync();

  watch.watchTree(
    config.context,
    {
      interval: 0.5,
    },
    async function (files, curr, prev) {
      const date = +new Date();

      if (typeof files == 'object' && prev === null && curr === null) {
        // Finished walking the tree
        // console.log(f, 'Finished walking the tree');

        await compiler(Object.keys(files).filter((file) => fse.statSync(file).isFile()));

        // 监听dist下的project.config.json
        watch.watchTree(
          config.output,
          {
            interval: 0.5,
          },
          async function (files, curr, prev) {
            if (typeof f == 'object' && prev === null && curr === null) {
              // Finished walking the tree
            } else if (prev === null) {
              // f is a new file
            } else if (curr.nlink === 0) {
              // f was removed
            } else if (/(project\.config\.json)$/g.test(files)) {
              // f was changed
              const exists = fse.existsSync(convertToContext(files));
              const same = fse.readFileSync(files).toString() === (exists ? fse.readFileSync(convertToContext(files)).toString() : '');

              if (!same) {
                await copy(files, convertToContext(files));
                console.log('[weapp]', '更改文件：', chalk.green(files));
                console.log('[weapp]', '耗时：', chalk.green(`${+new Date() - date}ms`));
              }
            }
          },
        );
        // end
      } else if (prev === null) {
        // f is a new file
        await compilerCss(files);
        await copy(files, convertToOutput(files));
        console.log();
        console.log('[weapp]', '新增文件：', chalk.green(files));
        console.log('[weapp]', '耗时：', chalk.green(`${+new Date() - date}ms`));
      } else if (curr.nlink === 0) {
        // f was removed
        await compilerCss(files);
        fse.removeSync(convertToOutput(files));
        console.log();
        console.log('[weapp]', '删除文件：', chalk.green(files));
        console.log('[weapp]', '耗时：', chalk.green(`${+new Date() - date}ms`));
      } else {
        // f was changed
        await compilerCss(files);
        await copy(files, convertToOutput(files));
        // console.log();
        console.log('[weapp]', '更改文件：', chalk.green(files));
        console.log('[weapp]', '耗时：', chalk.green(`${+new Date() - date}ms`));
      }
    },
  );
};
