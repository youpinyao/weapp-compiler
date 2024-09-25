const path = require('path');
const fse = require('fs-extra');
const getContext = require('./getContext');
const getConfig = require('./getConfig');

const { ignoreSubpackages = [] } = getConfig();

let customAppConfig;

function setAppConfig(config) {
  customAppConfig = config;
}

function getAppConfig() {
  let config = customAppConfig || fse.readJSONSync(path.resolve(getContext(), 'app.json'));

  if (config.subpackages && ignoreSubpackages) {
    config = {
      ...config,
      subpackages: config.subpackages.filter((item) => !ignoreSubpackages.includes(item.root)),
    };
  }
  return config;
}

module.exports = {
  getAppConfig,
  setAppConfig,
};
