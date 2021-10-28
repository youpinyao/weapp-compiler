const fs = require('fs-extra');
const path = require('path');
const { output } = require('./config');
const { ENV } = require('./env');

module.exports = (config) => {
  fs.writeJSON(path.join(output, '.weapp'), {
    env: ENV.DEV,
    ...config,
  });
};
