const through = require('through2');
const path = require('path');
const pathRelative = require('../../utils/pathRelative');

module.exports = (config, to) =>
  through.obj(function (file, enc, cb) {
    const runPath = pathRelative(path.resolve(to, '../'), path.resolve(config.output, 'regeneratorRuntime.js'));

    file.contents = Buffer.from(`
      "use strict";
      var regeneratorRuntime = require("${runPath}");
      ${file.contents.toString().replace('"use strict";', '')}
    `);
    cb(null, file);
  });
