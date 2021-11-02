const path = require('path');
const fse = require('fs-extra');
const getContext = require('./getContext');

const appConfig = fse.readJSONSync(path.resolve(getContext(), 'app.json'));

function getAppConfig() {
  return appConfig;
}

module.exports = getAppConfig;
