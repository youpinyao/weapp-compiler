const { Compilation } = require('webpack');

class WeappPlugin {
  // eslint-disable-next-line
  constructor() {}

  // eslint-disable-next-line
  apply(compiler) {
    // const { RawSource } = compiler.webpack.sources;

    compiler.hooks.compilation.tap('WeappPlugin', (compilation) => {
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
              const source =
                asset.source._source && asset.source._source._children
                  ? asset.source._source._children[0]
                  : asset.source;

              // eslint-disable-next-line
              let content = source._value || source._valueAsString;

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
