const path = require('path');
const fse = require('fs-extra');
const getContext = require('./getContext');
const { addNodeModulesUsingComponent } = require('../utils/isNodeModulesUsingComponent');
const compatiblePath = require('../utils/compatiblePath');
const { getAppConfig } = require('./appConfig');

const context = getContext();
let entrys;

function init() {
  const appConfig = getAppConfig();
  entrys = {
    app: path.resolve(context, 'app'),
  };

  const addUsingComponents = (components, parent) => {
    Object.keys(components).forEach((key) => {
      let filePath = components[key];

      if (!/^(plugin:|plugin-private:|weui-miniprogram)/g.test(filePath)) {
        if (/^\//g.test(filePath)) {
          filePath = path.resolve(context, filePath.replace(/^\//g, ''));
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
          // eslint-disable-next-line
          readUsingComponents(`${filePath}.json`);
        }

        let entryKey = filePath;

        if (/\/node_modules\//g.test(filePath) || /\\node_modules\\/g.test(filePath)) {
          // eslint-disable-next-line
          entryKey = compatiblePath(filePath).split('/node_modules/')[1];

          addNodeModulesUsingComponent(entryKey);
        } else {
          entryKey = path.relative(context, filePath);
        }

        entryKey = compatiblePath(entryKey);

        entrys[entryKey] = filePath;
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
    entrys[page] = path.resolve(context, page);
  });

  // tabbar
  if (fse.existsSync(path.resolve(context, 'custom-tab-bar/index.js'))) {
    entrys['custom-tab-bar/index'] = path.resolve(context, 'custom-tab-bar/index');
  }

  // subpackages
  (appConfig.subpackages || []).forEach((pkg) => {
    (pkg.pages || []).forEach((page) => {
      entrys[compatiblePath(path.join(pkg.root, page))] = path.resolve(context, pkg.root, page);
    });
  });

  // usingComponents
  Object.values(entrys).forEach((item) => {
    readUsingComponents(`${item}.json`);
  });
}

module.exports = () => {
  if (!entrys) {
    init();
  }
  return entrys;
};
