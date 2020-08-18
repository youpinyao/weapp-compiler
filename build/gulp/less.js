const path = require('path');
const less = require('gulp-less');
const gulpTask = require('./task');
const config = require('../utils/config')();

module.exports = async function gulpSass(from, to) {
  return gulpTask(
    from,
    to,
    less({
      paths: [config.context],
    }),
  );
};
