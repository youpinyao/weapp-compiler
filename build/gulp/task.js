const gulp = require('gulp');
const path = require('path');

const extname = require('./loader/extname');
const alias = require('./loader/alias');
const empty = require('./loader/empty');
const node_modules = require('./loader/node_modules');
const env = require('./loader/env');

module.exports = async function gulpTask(from, to, loader = empty()) {
  return new Promise((resolve, reject) => {
    gulp
      .src(from)
      .pipe(env())
      .pipe(node_modules(to))
      .pipe(alias(to))
      .pipe(loader.on('error', e => {
        reject(e);
      }))
      .pipe(extname(to))
      .pipe(gulp.dest(path.resolve(to, '../')))
      .on('end', function (res) {
        resolve(res);
      });
  });
};
