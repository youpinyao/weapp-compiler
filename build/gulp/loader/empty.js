const through = require('through2');

module.exports = () =>
  through.obj(function (file, enc, cb) {
    cb(null, file);
  });
