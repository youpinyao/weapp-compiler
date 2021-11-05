const fs = require('fs-extra');
const path = require('path');
const getOutput = require('../config/getOutput');
const ENV = require('../config/ENV');

module.exports = (config) => {
  fs.writeJSON(path.join(getOutput(), '.weapp'), {
    env: ENV.DEV,
    ...config,
  });
};
