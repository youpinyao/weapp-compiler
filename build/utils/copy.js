const fse = require('fs-extra');

module.exports = (from, to) => {
  return new Promise((resolve, reject) => {
    fse.copy(from, to, async () => {
      resolve();
    });
  });
};
