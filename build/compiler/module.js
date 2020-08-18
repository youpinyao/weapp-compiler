const path = require('path');
const getConfig = require('../utils/config');
const getFiles = require('../utils/files');
const compiler = require('./compiler');

module.exports = async () => {
  const config = getConfig();
  const modules = config.modules || {};
  const keys = Object.keys(modules);

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
