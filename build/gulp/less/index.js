const less = require('gulp-less');
const gulpTask = require('../task');
const config = require('../../utils/config')();
const { checkCache, CacheImport } = require('./plugins/cache-import');

module.exports = async function gulpLass(from, to) {
  checkCache(from);
  return gulpTask(
    from,
    to,
    less({
      paths: [config.context],
      plugins: [
        new CacheImport({
          from,
          to,
        }),
      ],
    }),
  );
};
