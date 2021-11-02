const fs = require('fs');
const path = require('path');

function traverseDir(dir) {
  let result = [];
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.resolve(dir, file);

    if (fs.statSync(fullPath).isDirectory()) {
      result = result.concat(traverseDir(fullPath));
    } else {
      result.push(fullPath);
    }
  });

  return result;
}

module.exports = traverseDir;
