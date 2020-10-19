const through = require('through2');
const path = require('path');
const pathRelative = require('../../utils/pathRelative');
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

    conditions.push('url(');
    conditions.push('alias({{alias}})');

    let contents = file.contents.toString();

    conditions.forEach(condition => {
      Object.keys(alias).forEach(key => {
        const alia = path.resolve(config.output, alias[key]);
        let converted_path = pathRelative(path.resolve(to, '../'), alia);

        if (/^(https?):\/\//g.test(alias[key])) {
          converted_path = alias[key];
        };

        if (/^alias\(/g.test(condition)) {
          contents = contents.replace(new RegExp(`${condition.replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace('{{alias}}', key)}`, 'g'), converted_path);
        } else {
          converted_path = `${condition}${converted_path}`;
          contents = contents.replace(new RegExp(`${condition.replace(/\(/g, '\\(')}${key}`, 'g'), converted_path);
        }
      });
    });

    file.contents = Buffer.from(contents);

    cb(null, file);
  });
