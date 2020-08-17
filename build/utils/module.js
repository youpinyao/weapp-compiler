const path = require('path');
const getConfig = require('./config');
const getFiles = require('./files');
const compiler = require('../compiler/compiler');

module.exports = async () => {
  const config = getConfig();
  const keys = Object.keys(config.modules || {});

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const module_path = path.resolve(process.cwd(), 'node_modules', key);

    await compiler(
      getFiles(module_path).map((file) => {
        return {
          from: file,
          to: file.replace(module_path, path.resolve(config.output, config.modules[key])),
        };
      }),
      `[${key}]`,
    );
  }
};
