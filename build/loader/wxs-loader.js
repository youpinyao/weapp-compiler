const path = require('path');
const compatiblePath = require('../utils/compatiblePath');
const getContext = require('../config/getContext');
const loadModule = require('../utils/loadModule');
const context = getContext();

module.exports = async function loader(source) {
  this.cacheable(true);
  const callback = this.async();
  const filePath = this.resourcePath;
  let content = source.toString();
  const fileInfo = path.parse(filePath);
  const {
    _compiler: {
      options: {
        output: { path: distPath },
      },
    },
  } = this;

  const withDistPath = (str) => {
    if (str.startsWith(context)) {
      str = path.relative(context, str);
    }
    return compatiblePath(
      `${distPath}/${str.match(/"(.*)"/g) ? str.match(/"(.*)"/g)[0].replace(/"/g, '') : str}`,
    );
  };
  let fileInfoDir = withDistPath(fileInfo.dir);
  if (/node_modules/g.test(fileInfo.dir)) {
    fileInfoDir = withDistPath(compatiblePath(fileInfo.dir).split('/node_modules/').pop());
  }

  const requires = content.match(/require\(("|').*("|')\)/g) || [];

  for (let index = 0; index < requires.length; index += 1) {
    const item = requires[index];
    const name = item.replace(/^((require\(')|(require\("))/g, '').replace(/(('\))|("\)))$/g, '');
    const file = path.resolve(fileInfo.dir, name);
    const src = await loadModule.bind(this)(file);
    const fullSrc = withDistPath(src);

    if (/(\.wxs)$/i.test(file)) {
      while (content.indexOf(name) !== -1) {
        content = content.replace(name, path.relative(fileInfoDir, fullSrc));
      }
    }
  }

  callback(null, content);
};
module.exports.raw = true;
