const path = require('path');
const getWxmlAssets = require('../utils/getWxmlAssets');
const loadModule = require('../utils/loadModule');
const getContext = require('../config/getContext');
const compatiblePath = require('../utils/compatiblePath');
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
        output: { publicPath, path: distPath },
      },
    },
  } = this;
  const withPublicPath = (str) => {
    return compatiblePath(
      `${publicPath === 'auto' ? '' : publicPath}${str.match(/"(.*)"/g)[0].replace(/"/g, '')}`,
    );
  };
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

  const [assets, wxmls] = await getWxmlAssets.call(this, filePath, content);

  // 资源文件
  for (let index = 0; index < assets.length; index += 1) {
    const [attr, file] = assets[index];
    const src = await loadModule.call(this, file);
    const fullSrc = withPublicPath(src);

    while (content.indexOf(attr) !== -1) {
      content = content.replace(attr, fullSrc);
    }
  }

  // wxml文件
  for (let index = 0; index < wxmls.length; index += 1) {
    const [attr, file] = wxmls[index];
    const src = await loadModule.call(this, file);
    const fullSrc = withDistPath(src);

    if (/(\.wxs)$/i.test(file)) {
      while (content.indexOf(attr) !== -1) {
        content = content.replace(attr, compatiblePath(path.relative(fileInfoDir, fullSrc)));
      }
    }
  }

  callback(null, content);
};
module.exports.raw = true;
