const fse = require('fs-extra');
const path = require('path');
const sass = require('gulp-sass');
const config = require('../utils/config')();
const gulpTask = require('./task');

module.exports = async function gulpSass(from, to) {
  return gulpTask(
    from,
    to,
    sass({
      errLogToConsole: true,
      importer: function (url, prev, done) {
        let contents = '';
        try {
          contents = fse.readFileSync(path.resolve(from, '../', url)).toString();
        } catch (error) {
          contents = fse
            .readFileSync(path.resolve(config.context, url.replace('file:', '.')))
            .toString();
        }
        done({
          contents,
        });
      },
    }).on('error', sass.logError),
  );
};
