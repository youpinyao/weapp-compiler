const gulpSass = require('../gulp/sass');
const gulpLess = require('../gulp/less');
const gulpFile = require('../gulp/file');

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
      gulpFile(from, to).then(() => {
        resolve();
      });
    }
  });
};
