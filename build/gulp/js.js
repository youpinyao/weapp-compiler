const gulpTask = require('./task');
const eslint = require('./loader/eslint');

module.exports = async function gulpSass(from, to) {
  return gulpTask(
    from,
    to,
    eslint(),
  );
};
