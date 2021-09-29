const path = require('path');
const { minify } = require('terser');
const { RawSource } = require('webpack-sources');
const { assets: assetsDir, isNodeModulesUsingComponent } = require('../config');
const resourceAccept = require('../resourceAccept');
const { addToUploadQueue } = require('../upload');
const withWindows = require('../withWindows');

const pluginName = 'WeappCompilerPlugin';

class WeappPlugin {
  // eslint-disable-next-line
  constructor() {}

  // eslint-disable-next-line
  apply(compiler) {
    // const { RawSource } = compiler.webpack.sources;

    let obsAssets = [];
    // compiler.hooks.shouldEmit.tap(pluginName, () => {
    //   // return true to emit the output, otherwise false
    //   console.log('compiler.hooks.shouldEmit');
    //   return true;
    // });
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
              return resourceAccept.test(key) && new RegExp(`${assetsDir}/`, 'g').test(key);
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
          let hasVendorJs = false;
          const subpackages = {};

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
            if (/subpackage_common/g.test(item.name)) {
              const pathInfo = path.parse(item.name);

              if (!subpackages[withWindows(pathInfo.dir)]) {
                subpackages[withWindows(pathInfo.dir)] = {
                  js: '',
                  wxss: '',
                };
              }
              if (/(\.js)$/g.test(item.name)) {
                subpackages[withWindows(pathInfo.dir)].js = withWindows(item.name);
              }
              if (/(\.wxss)$/g.test(item.name)) {
                subpackages[withWindows(pathInfo.dir)].wxss = withWindows(item.name);
              }
            }
          }

          for (let index = 0; index < items.length; index += 1) {
            const asset = items[index];

            const assetName = withWindows(asset.name);
            const isJs = /(\.(js))$/g.test(assetName);
            const { source } = asset;
            let content = source.source();

            if (content.toString) {
              content = content.toString();
            }

            // 注入全局引用模块
            if (isJs) {
              content = content.replace(
                'var __webpack_module_cache__ = {};',
                `
                  if (!global.__webpack_module_cache__) {
                    global.__webpack_module_cache__ = {};
                  }
                  var __webpack_module_cache__ = global.__webpack_module_cache__;
                  `,
              );
              // sdk2.17.3 window 下没有 regeneratorRuntime
              content = content.replace(
                'Function("r", "regeneratorRuntime = r")(runtime);',
                'global.regeneratorRuntime = runtime',
              );
              // content = content.replace('/******/ (() => { // webpackBootstrap', '');
              // content = content.replace('/******/ })()\n;', '');
              if (!/(var self = global;)/g.test(content)) {
                content = `var self = global; \n${content}`;
              }
            }

            // 注入公共模块
            if (assetName === 'app.js') {
              if (!/require('\.\/commons\.js')/g.test(content) && hasCommonJs) {
                content = `require('./commons.js');\n${content}`;
              }
              if (!/require('\.\/vendors\.js')/g.test(content) && hasVendorJs) {
                content = `require('./vendors.js');\n${content}`;
              }
            }

            // 注入公共模块
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
                  content = `require('${withWindows(
                    path.relative(path.parse(assetName).dir, res.js),
                  )}');\n${content}`;
                }
                if (
                  res.wxss &&
                  /(\.wxss)$/g.test(assetName) &&
                  !/'subpackage_common\.wxss';/g.test(content)
                ) {
                  content = `@import '${withWindows(
                    path.relative(path.parse(assetName).dir, res.wxss),
                  )}';\n${content}`;
                }
              }
            });

            if (isNodeModulesUsingComponent(asset.name) && compiler.options.mode === 'development') {
              if (isJs) {
                content = (
                  await minify(content, {
                    compress: true,
                    mangle: false,
                  })
                ).code;
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
