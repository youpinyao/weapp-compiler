const path = require('path');
const fse = require('fs-extra');
const getContext = require('./getContext');

let customAppConfig;

function setAppConfig(config) {
  customAppConfig = config;
}

function getAppConfig() {
  return customAppConfig || fse.readJSONSync(path.resolve(getContext(), 'app.json'));
}

module.exports = {
  getAppConfig,
  setAppConfig,
};
