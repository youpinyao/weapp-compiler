const fse = require('fs-extra');
const gulpSass = require('../gulp/sass');
const gulpLess = require('../gulp/less');

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
    } else {
      fse.copy(from, to, async () => {
        resolve();
      });
    }
  });
};
