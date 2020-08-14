const fs = require('fs');
const fse = require('fs-extra');
const hasha = require('hasha');
const chalk = require('chalk');
const path = require('path');
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');
const clear = require('./utils/clear');
const exists = require('./utils/exists');
const copy = require('./utils/copy');
const checkModuleSync = require('./utils/module');

class WeappPlugin {
  // eslint-disable-next-line
  constructor(options) {}
  apply(compiler) {
    const options = compiler.options;
    const files = loadFiles(options.context);
    let start_date;

    files.forEach((file, i) => {
      new SingleEntryPlugin(options.context, file, 'main').apply(compiler);
    });

    compiler.hooks.beforeCompile.tap('WeappHook', () => {
      start_date = +new Date();
    });

    compiler.hooks.done.tap('WeappHook', (stats) => {
      clear();

      const date = +new Date();
      const options = compiler.options;
      const files = loadFiles(options.context);
      let count = 0;
      let cache_count = 0;
      const promises = [];
      const copySync = async (from, to) => {
        const from_hash = await hasha.fromFile(from, { algorithm: 'md5' });
        const isExist = await exists(to);
        let to_hash;

        if (isExist) {
          to_hash = await hasha.fromFile(to, { algorithm: 'md5' });
        }

        if (from_hash !== to_hash) {
          await copy(from, to);
          count++;
          console.log('[weapp]', chalk.green(`${from}`));
        } else {
          cache_count++;
        }
      };

      console.log();
      files.forEach((file) => {
        promises.push(copySync(file, file.replace(options.context, options.output.path)));
      });

      Promise.all(promises).then(() => {
        console.log();

        checkModuleSync(options.output.path);

        console.log('[weapp]', '更新文件总数：', chalk.green(count));
        console.log('[weapp]', '缓存文件总数：', chalk.yellow(cache_count));
        console.log('[weapp]', 'webpack构建时间：', chalk.green(`${+new Date() - start_date}ms`));
        console.log('[weapp]', 'weapp构建时间：', chalk.green(`${+new Date() - date}ms`));

        fse.removeSync(path.resolve(options.output.path, 'main.js'));
      });
    });
  }
}

module.exports = WeappPlugin;

function loadFiles(_dir) {
  const allFiles = [];
  const loadDir = (dir) => {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filePath = path.resolve(dir, file);

      if (fs.lstatSync(filePath).isDirectory()) {
        loadDir(filePath);
      } else if (!/\/\.|\\\./g.test(filePath)) {
        allFiles.push(filePath);
      }
    });
  };

  loadDir(_dir);

  return allFiles;
}
