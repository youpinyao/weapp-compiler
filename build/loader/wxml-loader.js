const getWxmlAssets = require('../utils/getWxmlAssets');
const loadModule = require('../utils/loadModule');
const compatiblePath = require('../utils/compatiblePath');

module.exports = async function loader(source) {
  this.cacheable(true);
  const callback = this.async();
  const filePath = this.resourcePath;
  let content = source.toString();
  const {
    _compiler: {
      options: {
        output: { publicPath },
      },
    },
  } = this;
  const withPublicPath = (str) => {
    return `${publicPath === 'auto' ? '' : publicPath}${str.match(/"(.*)"/g)[0].replace(/"/g, '')}`;
  };
  const withRootPath = (str) => {
    return compatiblePath(`/${str.match(/"(.*)"/g)[0].replace(/"/g, '')}`);
  };


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
    const fullSrc = withRootPath(src);

    if (/(\.wxs)$/i.test(file)) {
      while (content.indexOf(attr) !== -1) {
        content = content.replace(attr, fullSrc);
      }
    }
  }

  callback(null, content);
};
module.exports.raw = true;
