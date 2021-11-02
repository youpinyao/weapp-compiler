const path = require('path');
const loadModule = require('../utils/loadModule');

module.exports = async function loader(source) {
  this.cacheable(true);
  const callback = this.async();
  const filePath = this.resourcePath;
  const content = source.toString();
  const fileInfo = path.parse(filePath);

  const requires = content.match(/require\(("|').*("|')\)/g) || [];

  for (let index = 0; index < requires.length; index += 1) {
    const item = requires[index];

    const file = path.resolve(
      fileInfo.dir,
      item.replace(/^((require\(')|(require\("))/g, '').replace(/(('\))|("\)))$/g, ''),
    );
    await loadModule.bind(this)(file);
  }

  callback(null, content);
};
module.exports.raw = true;
