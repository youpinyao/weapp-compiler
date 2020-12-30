const gulp = require('gulp');
const path = require('path');

const extname = require('./loader/extname');
const alias = require('./loader/alias');
const empty = require('./loader/empty');
const env = require('./loader/env');

module.exports = async function gulpTask(from, to, ...loaders) {
  return new Promise((resolve, reject) => {
    let pipes = gulp.src(from).pipe(env()).pipe(alias(to));

    (loaders || []).forEach((loader = empty()) => {
      pipes = pipes.pipe(
        loader.on('error', (e) => {
          console.error(e);
          resolve('');
        }),
      );
    });

    pipes = pipes.pipe(alias(to, /(sass|less|wxss)$/g));

    pipes
      .pipe(extname(to))
      .pipe(gulp.dest(path.resolve(to, '../')))
      .on('end', function (res) {
        resolve(res);
      });
  });
};
