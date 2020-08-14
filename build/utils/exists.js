const fse = require('fs-extra');

module.exports = (file) => {
  return new Promise((resolve, reject) => {
    fse.exists(file, async (isExist) => {
      resolve(isExist);
    });
  });
};
