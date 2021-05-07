const os = require('os');

const platform = os.platform();

function withWindows(str) {
  if (platform === 'win32') {
    return str.replace(/\\/g, '/');
  }
  return str;
}

module.exports = withWindows;
