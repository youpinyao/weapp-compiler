/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const fse = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const dayjs = require('dayjs');

function clearConsole() {
  process.stdout.write(process.platform === 'win32' ? '\x1Bc' : '\x1B[2J\x1B[3J\x1B[H');
  console.log('[weapp]', chalk.yellow(dayjs().format('YYYY-MM-DD HH:mm:ss')));
}

function clearOutput(output) {
  if (fse.existsSync(output)) {
    fse.readdirSync(output).forEach((file) => {
      fse.removeSync(path.resolve(output, file));
    });
  }
  console.log('[weapp]', chalk.green(`${output} 删除成功`));
}

module.exports = {
  clearConsole,
  clearOutput,
};
