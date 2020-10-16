const babel = require('gulp-babel');
const gulpTask = require('./task');
const eslint = require('./loader/eslint');
const regeneratorRuntime = require('./loader/regeneratorRuntime');

module.exports = async function gulpJs(from, to, config) {
  const gulpBabel = babel({
    presets: ['@babel/env'],
  });
  return gulpTask(
    from,
    to,
    config.eslint ? eslint() : undefined,
    config.babel !== false ? gulpBabel : undefined,
    regeneratorRuntime(config, to),
  );
};
