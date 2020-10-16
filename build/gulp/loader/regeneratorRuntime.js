const through = require('through2');
const path = require('path');

module.exports = (config, to) =>
  through.obj(function (file, enc, cb) {
    file.contents = Buffer.from(`
      "use strict";
      var regeneratorRuntime = require("${path.relative(path.resolve(to, '../'), path.resolve(config.output, 'regeneratorRuntime.js'))}");
      ${file.contents.toString().replace('"use strict";', '')}
    `);
    cb(null, file);
  });
