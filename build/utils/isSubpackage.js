const compatiblePath = require('./compatiblePath');
const { getAppConfig } = require('../config/appConfig');

function isSubpackage(file) {
  const appConfig = getAppConfig();
  let isSub = false;

  (appConfig.subpackages || []).forEach((pkg) => {
    let { root } = pkg;

    if (!/\/$/g.test(root)) {
      root = `${root}/`;
    }

    if (compatiblePath(file).indexOf(root) === 0) {
      isSub = true;
    }
  });
  return isSub;
}
module.exports = isSubpackage;
