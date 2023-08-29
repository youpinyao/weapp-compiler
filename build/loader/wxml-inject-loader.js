const getPageEntrys = require('../config/getPageEntrys');
const getConfig = require('../config/getConfig');
const compatiblePath = require('../utils/compatiblePath');

const pageEntrys = Object.values(getPageEntrys()).map((item) => compatiblePath(item));
const { pageWxmlInject } = getConfig();

module.exports = async function loader(source) {
  this.cacheable(true);
  const callback = this.async();
  const filePath = this.resourcePath;
  let content = source.toString();

  if (pageWxmlInject && pageEntrys.includes(compatiblePath(filePath).replace(/(\.wxml)$/i, ''))) {
    content +=
      typeof pageWxmlInject === 'function'
        ? pageWxmlInject(compatiblePath(filePath))
        : pageWxmlInject;
  }

  callback(null, content);
};
module.exports.raw = true;
