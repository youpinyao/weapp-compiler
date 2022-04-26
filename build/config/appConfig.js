const path = require('path');
const fse = require('fs-extra');
const getContext = require('./getContext');

const appConfig = fse.readJSONSync(path.resolve(getContext(), 'app.json'));
let customAppConfig;

function setAppConfig(config) {
  customAppConfig = config;
}

function getAppConfig() {
  return customAppConfig || appConfig;
}

module.exports = {
  getAppConfig,
  setAppConfig,
};
