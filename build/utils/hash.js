const path = require('path');
const fse = require('fs-extra');
const { debounce } = require('throttle-debounce');
const hashFileDir = path.resolve(process.cwd(), '.weapp');
const hashFilePath = path.resolve(process.cwd(), '.weapp/hash.json');
let hashData = {};
const saveFile = debounce(100, false, () => {
  fse.writeFileSync(hashFilePath, JSON.stringify(hashData, null, '\t'));
});
if (!fse.pathExistsSync(hashFileDir)) {
  fse.mkdirSync(hashFileDir);
}
if (fse.existsSync(hashFilePath)) {
  try {
    hashData = fse.readJSONSync(hashFilePath);
  } catch (error) {
    console.error(error);
  }
} else {
  fse.writeFileSync(hashFilePath, '{}');
}

module.exports = {
  get(key) {
    return hashData[key];
  },
  set(key, value) {
    hashData[key] = value;
    saveFile();
  },
  hashFileDir,
};
