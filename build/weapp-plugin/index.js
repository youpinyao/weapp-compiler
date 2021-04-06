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
          Object.entries(assets)
            .map(([name, source]) => {
              return {
                name,
                source,
              };
            })
            .filter((item) => /(\.js)$/g.test(item.name))
            .forEach((asset) => {
              const source = asset.source.getChildren
                ? asset.source.getChildren()[0]
                : // eslint-disable-next-line
                  asset.source._source.getChildren()[0];

              // eslint-disable-next-line
              let content = source._value;

              content = content.replace(
                'var __webpack_module_cache__ = {};',
                `
              if (!global.__webpack_module_cache__) {
                global.__webpack_module_cache__ = {};
              }
              var __webpack_module_cache__ = global.__webpack_module_cache__;
              `,
              );
              content = content.replace('/******/ (() => { // webpackBootstrap', '');
              content = content.replace('/******/ })()\n;', '');
              // if (!/^(var self = global;)/g.test(content)) {
              //   content = `var self = global; \n${content}`;
              // }

              // eslint-disable-next-line
              source._value = content;

              compilation.updateAsset(asset.name, asset.source);
            });
        },
      );
    });
  }
}

module.exports = WeappPlugin;
