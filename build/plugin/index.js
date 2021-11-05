const path = require('path');
const UglifyJS = require('uglify-js');
const hasha = require('hasha');
const { RawSource } = require('webpack-sources');

const { isNodeModulesUsingComponent } = require('../utils/isNodeModulesUsingComponent');
const getAssets = require('../config/getAssets');
const { addToUploadQueue } = require('../utils/upload');
const getResourceAccept = require('../config/getResourceAccept');
const compatiblePath = require('../utils/compatiblePath');
const ENV = require('../config/ENV');

const env = ENV();

const assetsDir = getAssets();
const pluginName = 'WeappCompilerPlugin';
const contentCache = {};

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
            let content = source.source();

            if (content.toString) {
              content = content.toString();
            }

            // 注入全局引用模块
            if (isJs) {
              if (!/(var self = global;)/g.test(content)) {
                content = `var self = global; \n${content}`;
              }
            }

            // runtime 暴露到全局
            if (assetName === 'runtime.js') {
              content = content.replace(
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
              // sdk2.17.3 window 下没有 regeneratorRuntime
              content = content.replace(
                'Function("r", "regeneratorRuntime = r")(runtime);',
                'global.regeneratorRuntime = runtime',
              );
              if (!/require('\.\/commons\.js')/g.test(content) && hasCommonJs) {
                content = `require('./commons.js');\n${content}`;
              }
              if (!/require('\.\/vendors\.js')/g.test(content) && hasVendorJs) {
                content = `require('./vendors.js');\n${content}`;
              }
              if (!/require('\.\/runtime\.js')/g.test(content) && hasRuntimeJs) {
                content = `require('./runtime.js');\n${content}`;
              }
            }

            // 注入公共模块 css
            if (assetName === 'app.wxss') {
              if (!/@import '\.\/commons\.wxss'/g.test(content) && hasCommonWxss) {
                content = `@import './commons.wxss';\n${content}`;
              }
              if (!/@import '\.\/vendors_wxss\.wxss'/g.test(content) && hasVendorWxss) {
                content = `@import './vendors_wxss.wxss';\n${content}`;
              }
            }

            // 分包注入公共模块
            Object.keys(subpackages).forEach((subpackage) => {
              const res = subpackages[subpackage];

              if (
                assetName.startsWith(subpackage) &&
                !/(subpackage_common\.(js|wxss))$/g.test(assetName)
              ) {
                if (
                  res.js &&
                  /(\.js)$/g.test(assetName) &&
                  !/'subpackage_common\.js'\);/g.test(content)
                ) {
                  content = `require('${compatiblePath(
                    path.relative(path.parse(assetName).dir, res.js),
                  )}');\n${content}`;
                }
                if (
                  res.wxss &&
                  /(\.wxss)$/g.test(assetName) &&
                  !/'subpackage_common\.wxss';/g.test(content)
                ) {
                  content = `@import '${compatiblePath(
                    path.relative(path.parse(assetName).dir, res.wxss),
                  )}';\n${content}`;
                }
              }
            });

            // 压缩 公共模块
            if (
              (assetName === 'commons.js' ||
                assetName === 'vendors.js' ||
                isNodeModulesUsingComponent(asset.name)) &&
              compiler.options.mode === env.DEV
            ) {
              const hash = hasha(content);
              if (contentCache[assetName] && contentCache[assetName].hash === hash) {
                content = contentCache[assetName].content;
              } else if (isJs) {
                content = UglifyJS.minify(content, {
                  mangle: false,
                  compress: {
                    drop_console: false,
                    drop_debugger: false,
                  },
                  sourceMap: false,
                }).code;
                contentCache[assetName] = {
                  hash,
                  content,
                };
              }
            }
            compilation.updateAsset(asset.name, new RawSource(content));
          }
        },
      );
    });
  }
}

module.exports = WeappPlugin;
