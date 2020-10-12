const gulpSass = require('../gulp/sass');
const gulpLess = require('../gulp/less/index');
const gulpJs = require('../gulp/js');
const gulpFile = require('../gulp/file');
const fse = require('fs-extra');
const config = require('./config')();

module.exports = async (from, to) => {
  if (!from || !to) {
    throw new Error(`文件路径不能为空 from:${from} to:${to}`);
  }
  if (/(\.scss)$/g.test(from)) {
    await gulpSass(from, to);
  } else if (/(\.less)$/g.test(from)) {
    await gulpLess(from, to);
  } else if (/\.(js)$/g.test(from)) {
    await gulpJs(from, to, config);
  } else if (/\.(js|wxml|wxss|wxs|json)$/g.test(from)) {
    await gulpFile(from, to);
  } else {
    fse.copySync(from, to);
  }
};
