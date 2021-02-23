const fse = require('fs-extra');
const hasha = require('hasha');
const path = require('path');

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
  const fromFileHash = await hasha.fromFile(from, { algorithm: 'md5' });
  const toPath = to.replace(/\.(scss|less)$/g, '.wxss');
  const tempPath = path.resolve(hash.hashFileDir, encodeURIComponent(toPath));
  let toFileHash = '';
  let tempFileHash = '';

  if (fse.existsSync(toPath)) {
    toFileHash = await hasha.fromFile(toPath, { algorithm: 'md5' });
  }
  if (fse.existsSync(tempPath)) {
    tempFileHash = await hasha.fromFile(tempPath, { algorithm: 'md5' });
  }

  if (hash.get(from) === fromFileHash) {
    // 完全匹配就直接返回
    if (toFileHash === hash.get(toPath)) {
      return false;
    }
    if (tempFileHash) {
      fse.copySync(tempPath, toPath);
      return false;
    }
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

  toFileHash = await hasha.fromFile(toPath, { algorithm: 'md5' });

  hash.set(from, fromFileHash);
  hash.set(toPath, toFileHash);

  fse.copySync(toPath, tempPath);
};
