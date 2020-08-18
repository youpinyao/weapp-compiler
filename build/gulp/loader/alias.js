const through = require('through2');
const path = require('path');
const config = require('../../utils/config')();

module.exports = (to) =>
  through.obj(function (file, enc, cb) {
    const alias = config.alias || {};
    let conditions = [
      'require(',
      'import ',
      'from ',
      'src=',
      'url(',
    ];

    conditions = conditions.map(item => `${item}'`).concat(conditions.map(item => `${item}"`));

    let contents = file.contents.toString();

    conditions.forEach(condition => {
      Object.keys(alias).forEach(key => {
        const alia = path.resolve(config.output, alias[key]);
        let converted_path = `${condition}${path.relative(path.resolve(to, '../'), alia)}`;

        if (/^(https?):\/\//g.test(alias[key])) {
          converted_path = `${condition}${alias[key]}`;
        };

        contents = contents.replace(new RegExp(`${condition.replace(/\(/g, '\\(')}${key}`, 'g'), converted_path);
      });
    });

    file.contents = Buffer.from(contents);

    cb(null, file);
  });
