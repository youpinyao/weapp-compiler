const path = require('path');
const fse = require('fs-extra');
const getConfig = require('../utils/config');
const getFiles = require('../utils/files');
const compiler = require('./compiler');

module.exports = async () => {
  const config = getConfig();
  const modules = config.modules || {};
  const keys = Object.keys(modules);

  fse.copyFileSync(
    path.resolve(__dirname, '../utils/regeneratorRuntime.js'),
    path.resolve(config.output, 'regeneratorRuntime.js'),
  );

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const module_path = path.resolve(process.cwd(), 'node_modules', key);

    await compiler(
      getFiles(module_path).map((file) => {
        const to_path = path.resolve(config.output, config.modules[key]);

        return {
          from: file,
          to: path.extname(to_path) ? to_path : file.replace(module_path, to_path),
        };
      }),
      `[${key}]`,
    );
  }
};
