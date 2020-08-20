const gulpSass = require('../gulp/sass');
const gulpLess = require('../gulp/less');
const gulpJs = require('../gulp/js');
const gulpFile = require('../gulp/file');
const fse = require('fs-extra');
const config = require('./config')();

module.exports = (from, to) => {
  if (!from || !to) {
    throw new Error(`文件路径不能为空 from:${from} to:${to}`);
  }
  return new Promise((resolve) => {
    if (/(\.scss)$/g.test(from)) {
      gulpSass(from, to).then(() => {
        resolve();
      });
    } else if (/(\.less)$/g.test(from)) {
      gulpLess(from, to).then(() => {
        resolve();
      });
    } else if (/\.(js)$/g.test(from) && config.eslint) {
      gulpJs(from, to).then(() => {
        resolve();
      });
    } else if (/\.(js|wxml|wxss|wxs|json)$/g.test(from)) {
      gulpFile(from, to).then(() => {
        resolve();
      });
    } else {
      fse.copySync(from, to);
      resolve();
    }
  });
};
