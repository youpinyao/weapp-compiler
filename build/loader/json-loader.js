const path = require('path');
const getEntrys = require('../config/getEntrys');
const { getAppConfig } = require('../config/appConfig');

module.exports = async function loader(source) {
  this.cacheable(true);
  const entrys = getEntrys();
  const callback = this.async();
  const filePath = this.resourcePath;
  const fileInfo = path.parse(filePath);
  const sourceStr = source.toString();

  if (entrys.app === path.resolve(fileInfo.dir, fileInfo.name)) {
    callback(null, JSON.stringify(getAppConfig(), null, 2));
  } else {
    callback(null, sourceStr);
  }
};

module.exports.raw = true;
