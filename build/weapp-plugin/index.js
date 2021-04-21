const path = require('path');
const { Compilation } = require('webpack');
const { withWindows } = require('huawei-obs-sync/src/config');
const ObsClient = require('esdk-obs-nodejs');
const chalk = require('chalk');
const { output, obsConfig, publicPath } = require('../config');

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
  const file = Object.entries(uploadQueue).filter((item) => item[1] === false)[0];

  if (file) {
    uploadQueue[file[0]] = 'uploading';
    // console.log(chalk.yellow(file[0]));

    try {
      await getStat(file[0]);
      console.log(chalk.blue(`${publicPath}${path.relative(output, file[0])}`));
    } catch (error) {
      await doUpload(file[0]);
      console.log(chalk.green(`${publicPath}${path.relative(output, file[0])}`));
    }
    uploadQueue[file[0]] = 'completed';
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
              return /\.(png|jpg|gif|jpeg|svg|ttf|woff|eot|woff2|otf)$/i.test(key);
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
          const items = Object.entries(assets).map(([name, source]) => {
            return {
              name,
              source,
            };
          });

          const hasCommonWxss = items.some((item) => item.name === 'commons.wxss');
          const hasVendorWxss = items.some((item) => item.name === 'vendors.wxss');
          items
            .filter((item) => {
              return /(\.(js|wxss))$/g.test(item.name);
            })
            .forEach((asset) => {
              const isJs = /(\.(js))$/g.test(asset.name);
              let { source } = asset;

              // eslint-disable-next-line
              if (asset.source._source && asset.source._source._children) {
                // eslint-disable-next-line
                source = asset.source._source._children.filter(
                  (item) => typeof item !== 'string',
                )[0];
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
                if (!/^(var self = global;)/g.test(content)) {
                  content = `var self = global; \n${content}`;
                }

                if (!/require('\.\/commons\.js')/g.test(content) && asset.name === 'app.js') {
                  content = `require('./commons.js');\n${content}`;
                  content = `require('./vendors.js');\n${content}`;
                }
              }
              if (asset.name === 'app.wxss') {
                // console.log();
                // console.log(Object.keys(asset.source._source._children[0]));
                // console.log(asset.source._source._children[0]._value);
                // console.log(asset.source._source._children[0]._valueAsString);
              }
              if (
                !/@import '\.\/commons\.wxss'/g.test(content) &&
                hasCommonWxss &&
                asset.name === 'app.wxss'
              ) {
                content = `@import './commons.wxss';\n${content}`;
              }
              if (
                !/@import '\.\/vendors\.wxss'/g.test(content) &&
                hasVendorWxss &&
                asset.name === 'app.wxss'
              ) {
                content = `@import './vendors.wxss';\n${content}`;
              }

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
