const path = require('path');
const fse = require('fs-extra');
const getEntrys = require('../config/getEntrys');

const entrys = getEntrys();

module.exports = async function loader(source) {
  this.cacheable(true);
  const callback = this.async();
  const filePath = this.resourcePath;
  const fileInfo = path.parse(filePath);
  const sourceStr = source.toString();

  const imports = [sourceStr];

  if (Object.values(entrys).indexOf(path.resolve(fileInfo.dir, fileInfo.name)) !== -1) {
    const exts = ['.less', '.wxss', '.css', '.json', '.wxml'];

    for (let index = 0; index < exts.length; index += 1) {
      const ext = exts[index];
      const otherFilePath = path.resolve(fileInfo.dir, fileInfo.name + ext);

      if (await fse.pathExists(otherFilePath)) {
        imports.unshift(`import './${fileInfo.name}${ext}'\n`);
      }
    }
  }

  callback(null, imports.join(''));
};

module.exports.raw = true;
