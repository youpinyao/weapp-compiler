const compatiblePath = require('./compatiblePath');
const getAppConfig = require('../config/getAppConfig');

const appConfig = getAppConfig();

function isSubpackage(file) {
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
