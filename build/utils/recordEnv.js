const fs = require('fs-extra');
const path = require('path');
const getOutput = require('../config/getOutput');
const ENV = require('../config/env');

module.exports = (config) => {
  fs.writeJSONSync(path.join(getOutput(), 'weapp.env.json'), {
    env: ENV.DEV,
    ...config,
  });
};
