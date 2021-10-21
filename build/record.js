const fs = require('fs-extra');
const path = require('path');
const { output } = require('./config');

module.exports = (config) => {
  fs.writeJSON(path.join(output, '.weapp'), {
    env: 'development',
    ...config,
  });
};
