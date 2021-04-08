const path = require('path');
const fse = require('fs-extra');
const traverseDir = require('./traverseDir');

const entry = path.resolve(process.cwd(), 'src');
const weapp = path.resolve(process.cwd(), '.weapp.js');
const appConfig = fse.readJSONSync(path.resolve(entry, 'app.json'));
let projectConfig = {};

if (fse.existsSync(weapp)) {
  // eslint-disable-next-line
  projectConfig = require(weapp);
} else {
  fse.writeFileSync(weapp, 'module.exports = { alias: {} }');
}

const alias = {
  ...(projectConfig.alias || {}),
};
Object.keys(projectConfig.alias || {}).forEach((key) => {
  alias[`alias(${key})`] = alias[key];
});
module.exports = {
  entry,
  output: path.resolve(process.cwd(), 'dist'),
  ...projectConfig,
  alias,
  app: appConfig,
  entrys: (() => {
    const entrys = {
      app: path.resolve(entry, 'app'),
    };
    const addUsingComponents = (components, parent) => {
      Object.keys(components).forEach((key) => {
        let filePath = components[key];

        if (!/^(plugin:|plugin-private:|weui-miniprogram)/g.test(filePath)) {
          if (/^\//g.test(filePath)) {
            filePath = path.resolve(entry, filePath.replace(/^\//g, ''));
          }

          if (fse.existsSync(`${path.resolve(parent, filePath)}.js`)) {
            filePath = path.resolve(parent, filePath);
          } else {
            try {
              filePath = require.resolve(filePath);
              filePath = filePath.replace(/(\.js)$/g, '');
            } catch (error) {
              console.error(error);
            }
          }

          if (fse.existsSync(`${filePath}.json`)) {
            readUsingComponents(`${filePath}.json`);
          }

          entrys[
            /\/node_modules\//g.test(filePath)
              ? filePath.split('/node_modules/')[1]
              : path.relative(entry, filePath)
          ] = filePath;
        }
      });
    };
    const readUsingComponents = (file) => {
      const json = fse.readJSONSync(file);

      if (json.usingComponents) {
        addUsingComponents(json.usingComponents, path.parse(file).dir);
      }
    };

    // pages
    (appConfig.pages || []).forEach((page) => {
      entrys[page] = path.resolve(entry, page);
    });

    // tabbar
    if (fse.existsSync(path.resolve(entry, 'custom-tab-bar/index.js'))) {
      entrys['custom-tab-bar/index'] = path.resolve(entry, 'custom-tab-bar/index');
    }

    // subpackages
    (appConfig.subpackages || []).forEach((pkg) => {
      (pkg.pages || []).forEach((page) => {
        entrys[path.join(pkg.root, page)] = path.resolve(entry, pkg.root, page);
      });
    });

    // usingComponents
    traverseDir(entry).forEach((item) => {
      if (/(\.json)$/g.test(item)) {
        readUsingComponents(item);
      }
    });

    fse.writeJSONSync(path.resolve(process.cwd(), 'entrys.json'), entrys);
    return entrys;
  })(),
};
