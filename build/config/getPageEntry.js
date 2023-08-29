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
  entrys = {};

  // pages
  (appConfig.pages || []).forEach((page) => {
    entrys[page] = path.resolve(context, page);
  });

  // subpackages
  (appConfig.subpackages || []).forEach((pkg) => {
    (pkg.pages || []).forEach((page) => {
      entrys[compatiblePath(path.join(pkg.root, page))] = path.resolve(context, pkg.root, page);
    });
  });
}

module.exports = () => {
  if (!entrys) {
    init();
  }
  return entrys;
};
