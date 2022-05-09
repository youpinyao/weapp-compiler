const { getOptions } = require('loader-utils');
const path = require('path');
const getEntrys = require('../config/getEntrys');
const { getAppConfig } = require('../config/appConfig');
const getContext = require('../config/getContext');

module.exports = async function loader(source) {
  this.cacheable(true);
  const entrys = getEntrys();
  const options = getOptions(this);
  // const callback = this.async();
  const filePath = this.resourcePath;
  const fileInfo = path.parse(filePath);
  const sourceStr = source.toString();
  const name = options.name ? options.name(filePath) : path.relative(getContext(), filePath);
  let content = sourceStr;

  if (entrys.app === path.resolve(fileInfo.dir, fileInfo.name)) {
    content = JSON.stringify(getAppConfig(), null, 2);
  }
  this.emitFile(name, content);

  return `module.exports = ${content}`;
};

module.exports.raw = true;
