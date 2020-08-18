const fs = require('fs');
const path = require('path');

module.exports = (_dir) => {
  const allFiles = [];
  const loadDir = (dir) => {
    const stat = fs.statSync(dir);

    if (stat.isFile()) {
      allFiles.push(dir);
      return;
    }

    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filePath = path.resolve(dir, file);

      if (fs.lstatSync(filePath).isDirectory()) {
        loadDir(filePath);
      } else if (!/\/\.|\\\./g.test(filePath)) {
        allFiles.push(filePath);
      }
    });
  };

  loadDir(_dir);

  return allFiles;
};
