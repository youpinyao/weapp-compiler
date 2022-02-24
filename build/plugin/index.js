const path = require('path');
const { ReplaceSource } = require('webpack-sources');

const getAssets = require('../config/getAssets');
const { addToUploadQueue } = require('../utils/upload');
const getResourceAccept = require('../config/getResourceAccept');
const compatiblePath = require('../utils/compatiblePath');
const { isCopyFile } = require('../utils/isCopyFile');
const getContext = require('../config/getContext');

const assetsDir = getAssets();
const context = getContext();
const pluginName = 'WeappCompilerPlugin';

function sourceReplace(content, source, from, to) {
  if (content.indexOf(from) === -1) {
    return;
  }
  source.replace(content.indexOf(from), content.indexOf(from) + from.length, to);
}
function sourceInsert(content, source, insert) {
  if (!new RegExp(insert, 'g').test(content)) {
    source.insert(0, `${insert}\n`);
  }
}

class WeappPlugin {
  // eslint-disable-next-line
  constructor() {}

  // eslint-disable-next-line
  apply(compiler) {
    // const { RawSource } = compiler.webpack.sources;

    let obsAssets = [];

    compiler.hooks.done.tap(pluginName, () => {
      addToUploadQueue([...obsAssets]);
      obsAssets = [];
    });

    compiler.hooks.compilation.tap(pluginName, (compilation) => {
      compilation.hooks.afterProcessAssets.tap(
        {
          name: pluginName,
        },
        (assets) => {
          obsAssets = obsAssets.concat(
            Object.keys(assets).filter((key) => {
              return getResourceAccept().test(key) && new RegExp(`${assetsDir}/`, 'g').test(key);
            }),
          );
        },
      );

      compilation.hooks.processAssets.tap(
        {
          name: pluginName,
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        async (assets) => {
          // this callback will run against assets added later by plugins.
          const items = Object.entries(assets)
            .map(([name, source]) => {
              return {
                name,
                source,
              };
            })
            .filter((item) => {
              return /(\.(js|wxss))$/g.test(item.name);
            });

          let hasCommonWxss = false;
          let hasVendorWxss = false;
          let hasCommonJs = false;
          let hasRuntimeJs = false;
          let hasVendorJs = false;
          const subpackages = {};

          // 检测公共模块
          for (let index = 0; index < items.length; index += 1) {
            const item = items[index];

            if (hasCommonWxss === false && item.name === 'commons.wxss') {
              hasCommonWxss = true;
            }
            if (hasVendorWxss === false && item.name === 'vendors_wxss.wxss') {
              hasVendorWxss = true;
            }
            if (hasCommonJs === false && item.name === 'commons.js') {
              hasCommonJs = true;
            }
            if (hasVendorJs === false && item.name === 'vendors.js') {
              hasVendorJs = true;
            }
            if (hasRuntimeJs === false && item.name === 'runtime.js') {
              hasRuntimeJs = true;
            }
            if (/subpackage_common/g.test(item.name)) {
              const pathInfo = path.parse(item.name);

              if (!subpackages[compatiblePath(pathInfo.dir)]) {
                subpackages[compatiblePath(pathInfo.dir)] = {
                  js: '',
                  wxss: '',
                };
              }
              if (/(\.js)$/g.test(item.name)) {
                subpackages[compatiblePath(pathInfo.dir)].js = compatiblePath(item.name);
              }
              if (/(\.wxss)$/g.test(item.name)) {
                subpackages[compatiblePath(pathInfo.dir)].wxss = compatiblePath(item.name);
              }
            }
          }

          for (let index = 0; index < items.length; index += 1) {
            const asset = items[index];

            const assetName = compatiblePath(asset.name);
            const isJs = /(\.(js))$/g.test(assetName);
            const { source } = asset;
            const newSource = new ReplaceSource(source);
            let content = source.source();

            if (content.toString) {
              content = content.toString();
            }

            // 注入全局引用模块
            if (isJs) {
              sourceInsert(content, newSource, 'var self = global;');
              sourceReplace(
                content,
                newSource,
                'Function("r", "regeneratorRuntime = r")(runtime);',
                'global.regeneratorRuntime = runtime',
              );
            }

            // runtime 暴露到全局
            if (assetName === 'runtime.js') {
              sourceReplace(
                content,
                newSource,
                'var __webpack_module_cache__ = {};',
                `
              if (!global.__webpack_module_cache__) {
                global.__webpack_module_cache__ = {};
              }
              var __webpack_module_cache__ = global.__webpack_module_cache__;
              global.__webpack_require__ = __webpack_require__;
            `,
              );
            }

            // 注入公共模块 js
            if (assetName === 'app.js') {
              // eslint-disable-next-line no-unused-expressions
              hasCommonJs && sourceInsert(content, newSource, `require('./commons.js');`);
              // eslint-disable-next-line no-unused-expressions
              hasVendorJs && sourceInsert(content, newSource, `require('./vendors.js');`);
              // eslint-disable-next-line no-unused-expressions
              hasRuntimeJs && sourceInsert(content, newSource, `require('./runtime.js');`);
            }

            // 注入公共模块 css
            if (assetName === 'app.wxss') {
              // eslint-disable-next-line no-unused-expressions
              hasCommonWxss && sourceInsert(content, newSource, `@import './commons.wxss';`);
              // eslint-disable-next-line no-unused-expressions
              hasVendorWxss && sourceInsert(content, newSource, `@import './vendors_wxss.wxss';`);
            }

            // 分包注入公共模块
            Object.keys(subpackages).forEach((subpackage) => {
              const res = subpackages[subpackage];
              const isSubAndNotExist =
                assetName.startsWith(subpackage) &&
                !/(subpackage_common\.(js|wxss))$/g.test(assetName);

              if (isSubAndNotExist) {
                if (res.js && /(\.js)$/g.test(assetName)) {
                  sourceInsert(
                    content,
                    newSource,
                    `require('${compatiblePath(
                      path.relative(path.parse(assetName).dir, res.js),
                    )}');`,
                  );
                }
                if (res.wxss && /(\.wxss)$/g.test(assetName)) {
                  sourceInsert(
                    content,
                    newSource,
                    `require('${compatiblePath(
                      path.relative(path.parse(assetName).dir, res.wxss),
                    )}');`,
                  );
                }
              }
            });
            // 忽略 CopyPlugin的文件
            if (!isCopyFile(path.resolve(context, asset.name))) {
              compilation.updateAsset(asset.name, newSource);
            }
          }
        },
      );
    });
  }
}

module.exports = WeappPlugin;
