const posthtml = require('posthtml');
const getWxmlAssets = require('../utils/getWxmlAssets');
const loadModule = require('../utils/loadModule');

module.exports = async function loader(source) {
  this.cacheable(true);
  const callback = this.async();
  const filePath = this.resourcePath;
  let content = (
    await posthtml()
      .use((tree) => {
        tree.walk((node) => {
          if (typeof node === 'string') {
            if (/^(<!--)/g.test(node.trim())) {
              return '';
            }
            return node;
          }
          return node;
        });
      })
      .process(source.toString())
  ).html;
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

  const [assets, wxmls] = await getWxmlAssets.call(this, filePath, content);

  // 资源文件
  for (let index = 0; index < assets.length; index += 1) {
    const [attr, file] = assets[index];
    const src = await loadModule.call(this, file);

    content = content.replace(attr, withPublicPath(src, publicPath));
  }

  // wxml文件
  for (let index = 0; index < wxmls.length; index += 1) {
    const [, file] = wxmls[index];

    await loadModule.call(this, file);
  }

  callback(null, content);
};
module.exports.raw = true;
