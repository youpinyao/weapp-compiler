const path = require('path');
const os = require('os');
const platform = os.platform();

module.exports = function (from, to) {
  let result = path.relative(from, to);
  if (platform === 'win32') {
    result = result.replace(/\\/g, '/');
  }
  return result;
};
