const through = require('through2');

module.exports = () =>
  through.obj(function (file, enc, cb) {
    let contents = file.contents.toString();

    contents = contents.replace(/process\.env\.NODE_ENV/g, `'${process.env.NODE_ENV}'`);

    file.contents = Buffer.from(contents);

    cb(null, file);
  });
