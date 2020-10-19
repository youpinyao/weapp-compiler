const through = require('through2');
const os = require('os');
const platform = os.platform();
const path = require('path');

module.exports = (config, to) =>
  through.obj(function (file, enc, cb) {
    let runPath = path.relative(path.resolve(to, '../'), path.resolve(config.output, 'regeneratorRuntime.js'));

    if (platform === 'win32') {
      runPath = runPath.replace(/\\/g, '/');
    }
    file.contents = Buffer.from(`
      "use strict";
      var regeneratorRuntime = require("${runPath}");
      ${file.contents.toString().replace('"use strict";', '')}
    `);
    cb(null, file);
  });
