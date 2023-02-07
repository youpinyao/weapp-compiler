const through = require('through2');
const fse = require('fs-extra');
const path = require('path');
const os = require('os');
const platform = os.platform();
const config = require('../../utils/config')();

module.exports = (to) =>
  through.obj(function (file, enc, cb) {
    const package_path = path.resolve(process.cwd(), 'package.json');

    if (!fse.existsSync(package_path)) {
      cb(null, file);
      return;
    }
    const package_json = fse.readJSONSync(package_path);
    const modules = {
      ...package_json.dependencies,
      ...package_json.devDependencies,
    };
    const match_modules = [];

    const conditions = [
      "require('{{module}}')",
      'require("{{module}}")',
      "import '{{module}}'",
      'import "{{module}}"',
      "from '{{module}}'",
      'from "{{module}}"',
    ];

    let contents = file.contents.toString();

    conditions.forEach((condition) => {
      Object.keys(modules).forEach((key) => {
        const converted_condition = condition.replace(/\(/g, '\\(').replace(/\)/g, '\\)');

        if (new RegExp(`${converted_condition.replace('{{module}}', key)}`, 'g').test(contents)) {
          let module_path = path.join(
            path.relative(path.resolve(to, '../'), config.output),
            'npm_modules',
            require.resolve(key).replace(path.resolve(process.cwd(), 'node_modules'), ''),
          );

          if (platform === 'win32') {
            module_path = module_path.replace(/\\/g, '/');
          }
          contents = contents.replace(
            new RegExp(`${converted_condition.replace('{{module}}', key)}`, 'g'),
            condition.replace('{{module}}', module_path),
          );
          match_modules.push(require.resolve(key));
        }
      });
    });

    match_modules.forEach((key) => {
      fse.copySync(
        key,
        key.replace(
          path.resolve(process.cwd(), 'node_modules'),
          path.resolve(config.output, 'npm_modules'),
        ),
      );
    });

    file.contents = Buffer.from(contents);

    cb(null, file);
  });