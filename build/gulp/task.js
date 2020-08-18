const gulp = require('gulp');
const replaceExtension = require('replace-ext');
const through = require('through2');
const path = require('path');

module.exports = async function gulpTask(from, to, loader) {
  return new Promise((resolve) => {
    gulp
      .src(from)
      .pipe(loader)
      .pipe(
        through.obj(function (file, enc, cb) {
          let extname = path.extname(to);

          if (/scss|less/g.test(extname)) {
            extname = '.wxss';
          }

          file.path = replaceExtension(file.path, extname);

          cb(null, file);
        }),
      )
      .pipe(gulp.dest(path.resolve(to, '../')))
      .on('end', function () {
        resolve();
      });
  });
};
