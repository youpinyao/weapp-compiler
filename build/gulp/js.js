const babel = require('gulp-babel');
const gulpTask = require('./task');
const eslint = require('./loader/eslint');
const nodeModules = require('./loader/nodeModules');
const regeneratorRuntime = require('./loader/regeneratorRuntime');

module.exports = async function gulpJs(from, to, config) {
  const gulpBabel = babel({
    presets: ['@babel/env'],
  });
  const isIgnore = config.ignoreBabelExpression.some(item => new RegExp(item, 'g').test(to));

  return gulpTask(
    from,
    to,
    nodeModules(to),
    config.eslint ? eslint() : undefined,
    config.babel !== false && isIgnore === false ? gulpBabel : undefined,
    isIgnore === false ? regeneratorRuntime(config, to) : undefined,
  );
};
