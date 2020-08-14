const path = require('path');
const fse = require('fs-extra');
const getConfig = require('./config');

module.exports = (output) => {
  const config = getConfig();

  Object.keys(config.modules || {}).forEach((key) => {
    fse.copySync(
      path.resolve(process.cwd(), 'node_modules', key),
      path.resolve(output, config.modules[key]),
    );
  });
};
