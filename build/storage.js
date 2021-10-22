const path = require('path');
const fs = require('fs-extra');
const { debounce } = require('throttle-debounce');

const tempDir = path.resolve(process.cwd(), '.temp');
const uploadJsonDir = path.join(tempDir, 'upload.json');
let uploadJson = {};
const writeUploadJsonDebounce = debounce(300, () => {
  fs.writeJSONSync(uploadJsonDir, uploadJson);
});

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}
if (!fs.existsSync(uploadJsonDir)) {
  fs.writeJSONSync(uploadJsonDir, uploadJson);
} else {
  uploadJson = fs.readJSONSync(uploadJsonDir);
}

module.exports = {
  getStorage(key) {
    return uploadJson[key];
  },
  setStorage(key, value) {
    uploadJson[key] = value;
    writeUploadJsonDebounce();
  },
};
