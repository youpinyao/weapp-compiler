const through = require('through2');
const chalk = require('chalk');
const { ESLint } = require('eslint');
const eslint = new ESLint();

module.exports = () =>
  through.obj(async function (file, enc, cb) {
    // 2. Lint files. This doesn't modify target files.
    const results = await eslint.lintFiles([file.path]);
    const error = ESLint.getErrorResults(results)[0];

    if (error) {
      console.log();
      console.log(chalk.red(file.path));
      error.messages.forEach((item) => {
        console.log();
        console.log(
          chalk.red(`${item.message} line:${item.line},colunm:${item.column} (${item.ruleId})`),
        );
      });
      throw new Error();
    }
    cb(null, file);
  });
