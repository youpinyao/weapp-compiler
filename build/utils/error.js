
const chalk = require('chalk');

module.exports = function runCallback(err, stats) {
  if (err) {
    console.log(chalk.red(err.stack || err));
    if (err.details) {
      console.log(chalk.red(err.details));
    }
    return true;
  }

  const info = stats.toJson();

  if (stats.hasErrors()) {
    console.log(chalk.red(info.errors));
  }

  if (stats.hasWarnings()) {
    console.log(chalk.yellow(info.warnings));
  }

  return false;
};
