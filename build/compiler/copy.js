const fse = require('fs-extra');
const hasha = require('hasha');

const gulpSass = require('../gulp/sass');
const gulpLess = require('../gulp/less/index');
const gulpJs = require('../gulp/js');
const gulpFile = require('../gulp/file');
const config = require('../utils/config')();
const hash = require('../utils/hash');

module.exports = async (from, to) => {
  if (!from || !to) {
    throw new Error(`文件路径不能为空 from:${from} to:${to}`);
  }
  const fileHash = await hasha.fromFile(from, { algorithm: 'md5' });

  if (hash.get(from) === fileHash) {
    return false;
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

  hash.set(from, fileHash);
};
