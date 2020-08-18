const gulp = require('gulp');
const path = require('path');

const extname = require('./loader/extname');
const alias = require('./loader/alias');
const empty = require('./loader/empty');

module.exports = async function gulpTask(from, to, loader = empty()) {
  return new Promise((resolve) => {
    gulp
      .src(from)
      .pipe(alias(from))
      .pipe(loader)
      .pipe(extname(to))
      .pipe(gulp.dest(path.resolve(to, '../')))
      .on('end', function () {
        resolve();
      });
  });
};
