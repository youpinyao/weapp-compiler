const chalk = require('chalk');
const fse = require('fs-extra');
const path = require('path');

const packageDir = path.resolve(process.cwd(), 'package.json');

let packageConfig = {};

if (fse.existsSync(packageDir)) {
  // eslint-disable-next-line
  packageConfig = fse.readJsonSync(packageDir);
} else {
  throw Error(chalk.green('项目根目录没有package.json'));
}

function getPackage() {
  return {
    ...packageConfig,
  };
}

module.exports = getPackage;
