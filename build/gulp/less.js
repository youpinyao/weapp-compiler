const less = require('gulp-less');
const gulpTask = require('./task');
const config = require('../utils/config')();

module.exports = async function gulpLass(from, to) {
  return gulpTask(
    from,
    to,
    less({
      paths: [config.context],
    }),
  );
};
