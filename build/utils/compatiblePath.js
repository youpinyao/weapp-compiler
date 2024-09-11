const os = require('os');

const platform = os.platform();

function compatiblePath(str) {
  if (platform === 'win32') {
    // path.win32.normalize()
    return str.replace(/\\/g, '/').replace(/\/\//g, '/').replace(/:\//g, '://');
  }
  return str;
}

module.exports = compatiblePath;
