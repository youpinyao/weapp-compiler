const path = require('path');
const { Compilation } = require('webpack');
const { withWindows } = require('huawei-obs-sync/src/config');
const ObsClient = require('esdk-obs-nodejs');
const chalk = require('chalk');
const { output, obsConfig, publicPath, assets: assetsDir } = require('../config');

const client = new ObsClient({
  ...obsConfig,
});
const uploadQueue = {};

function doUpload(file) {
  return new Promise((resolve, reject) => {
    client.putObject(
      {
        Bucket: obsConfig.bucket,
        Key: withWindows(path.join(obsConfig.dir, path.relative(output, file))),
        SourceFile: file,
      },
      (err, result) => {
        if (err) {
          reject(err);
          // console.log(chalk.red("上传失败"), file);
        } else if (result.CommonMsg.Status >= 300) {
          reject(err);
          // console.log(chalk.red("上传失败"), file);
        } else {
          resolve(result);
          // console.log(chalk.green("上传成功"), file);
        }
      },
    );
  });
}
async function getStat(file) {
  return new Promise((resolve, reject) => {
    client.getObjectMetadata(
      {
        Bucket: obsConfig.bucket,
        Key: withWindows(path.join(obsConfig.dir, path.relative(output, file))),
      },
      (err, result) => {
        if (err) {
          reject(err);
        } else if (result.CommonMsg.Status < 300) {
          resolve(result);
        } else {
          reject(result);
        }
      },
    );
  });
}

async function checkUpload() {
  const files = Object.entries(uploadQueue)
    .filter((item) => item[1] === false)
    .splice(0, 10);

  if (files && files.length) {
    await Promise.all(
      files.map(async (file) => {
        uploadQueue[file[0]] = 'uploading';
        try {
          await getStat(file[0]);
          console.log(chalk.blue(`${publicPath}${path.relative(output, file[0])}`));
        } catch (error) {
          await doUpload(file[0]);
          console.log(chalk.green(`${publicPath}${path.relative(output, file[0])}`));
        }
        uploadQueue[file[0]] = 'completed';
      }),
    );

    checkUpload();
  }
}
function addToUploadQueue(assets) {
  if (!obsConfig) {
    console.warn('请配置obsConfig，否则无法上传obs');
    return;
  }

  assets.forEach((asset) => {
    const file = path.resolve(output, asset);
    if (uploadQueue[file] === undefined) {
      uploadQueue[file] = false;
    }
  });
  checkUpload();
}

class WeappPlugin {
  // eslint-disable-next-line
  constructor() {}

  // eslint-disable-next-line
  apply(compiler) {
    // const { RawSource } = compiler.webpack.sources;

    let obsAssets = [];
    // compiler.hooks.shouldEmit.tap('WeappPlugin', () => {
    //   // return true to emit the output, otherwise false
    //   console.log('compiler.hooks.shouldEmit');
    //   return true;
    // });
    compiler.hooks.done.tap('WeappPlugin', () => {
      addToUploadQueue([...obsAssets]);
      obsAssets = [];
    });

    compiler.hooks.compilation.tap('WeappPlugin', (compilation) => {
      compilation.hooks.afterProcessAssets.tap(
        {
          name: 'WeappPlugin',
        },
        (assets) => {
          obsAssets = obsAssets.concat(
            Object.keys(assets).filter((key) => {
              return (
                /\.(png|jpg|gif|jpeg|svg|ttf|woff|eot|woff2|otf)$/i.test(key) &&
                new RegExp(`${assetsDir}/`, 'g').test(key)
              );
            }),
          );
        },
      );

      compilation.hooks.processAssets.tap(
        {
          name: 'WeappPlugin',
          stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE,
          additionalAssets: true,
        },
        (assets) => {
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

          items.forEach((item) => {
            if (hasCommonWxss === false && item.name === 'commons.wxss') {
              hasCommonWxss = true;
            }
            if (hasVendorWxss === false && item.name === 'vendors.wxss') {
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

              if (!subpackages[pathInfo.dir]) {
                subpackages[pathInfo.dir] = {
                  js: '',
                  wxss: '',
                };
              }
              if (/(\.js)$/g.test(item.name)) {
                subpackages[pathInfo.dir].js = item.name;
              }
              if (/(\.wxss)$/g.test(item.name)) {
                subpackages[pathInfo.dir].wxss = item.name;
              }
            }
          });

          items.forEach((asset) => {
            const isJs = /(\.(js))$/g.test(asset.name);
            let { source } = asset;

            // eslint-disable-next-line
            if (asset.source._source && asset.source._source._children) {
              // eslint-disable-next-line
              source = asset.source._source._children.filter((item) => typeof item !== 'string')[0];
            }
            // eslint-disable-next-line
            if (asset.source._children) {
              // eslint-disable-next-line
              source = asset.source._children.filter((item) => typeof item !== 'string')[0];
            }

            // eslint-disable-next-line
            let content = source._value || source._valueAsString;

            // console.log('content', content, source);

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
              // content = content.replace('/******/ (() => { // webpackBootstrap', '');
              // content = content.replace('/******/ })()\n;', '');
              if (!/(var self = global;)/g.test(content)) {
                content = `var self = global; \n${content}`;
              }
            }

            // 注入公共模块
            if (asset.name === 'app.js') {
              if (!/require('\.\/commons\.js')/g.test(content) && hasCommonJs) {
                content = `require('./commons.js');\n${content}`;
              }
              if (!/require('\.\/vendors\.js')/g.test(content) && hasVendorJs) {
                content = `require('./vendors.js');\n${content}`;
              }
            }

            // 注入公共模块
            if (asset.name === 'app.wxss') {
              if (!/@import '\.\/commons\.wxss'/g.test(content) && hasCommonWxss) {
                content = `@import './commons.wxss';\n${content}`;
              }
              if (!/@import '\.\/vendors\.wxss'/g.test(content) && hasVendorWxss) {
                content = `@import './vendors.wxss';\n${content}`;
              }
            }

            // 分包注入公共模块
            Object.keys(subpackages).forEach((subpackage) => {
              const res = subpackages[subpackage];
              if (asset.name.startsWith(subpackage) && !/(subpackage_common\.(js|wxss))$/g.test(asset.name)) {
                if (
                  res.js &&
                  /(\.js)$/g.test(asset.name) &&
                  !/'subpackage_common\.js'\);/g.test(content)
                ) {
                  content = `require('${path.relative(path.parse(asset.name).dir, res.js)}');\n${content}`;
                }
                if (
                  res.wxss &&
                  /(\.wxss)$/g.test(asset.name) &&
                  !/'subpackage_common\.wxss';/g.test(content)
                ) {
                  content = `@import '${path.relative(path.parse(asset.name).dir, res.wxss)}';\n${content}`;
                }
              }
            });

            // eslint-disable-next-line
            if (source._value) {
              // eslint-disable-next-line
              source._value = content;
            } else {
              // eslint-disable-next-line
              source._valueAsString = content;
            }

            compilation.updateAsset(asset.name, asset.source);
          });
        },
      );
    });
  }
}

module.exports = WeappPlugin;
