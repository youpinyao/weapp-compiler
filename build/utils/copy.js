const fse = require('fs-extra');
const gulp = require('gulp');
const path = require('path');
const babel = require('gulp-babel');

module.exports = (from, to) => {
  if (!from || !to) {
    throw new Error(`文件路径不能为空 from:${from} to:${to}`);
  }
  return new Promise((resolve) => {
    if (/(\.js)$/g.test(from)) {
      gulpBabel(from, to).then(() => {
        resolve();
      });
    } else {
      fse.copy(from, to, async () => {
        resolve();
      });
    }
  });
};

async function gulpBabel(from, to) {
  return new Promise((resolve) => {
    gulp
      .src(from)
      .pipe(
        babel({
          presets: ['@babel/preset-env'],
        }),
      )
      .pipe(gulp.dest(path.resolve(to, '../')))
      .on('end', () => {
        resolve();
      });
  });
}
