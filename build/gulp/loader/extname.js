
const replaceExtension = require('replace-ext');
const through = require('through2');
const path = require('path');

module.exports = to => through.obj(function (file, enc, cb) {
  let extname = path.extname(to);

  // 文件后缀转化
  if (/scss|less/g.test(extname)) {
    extname = '.wxss';
  }

  file.path = replaceExtension(file.path, extname);

  cb(null, file);
});
