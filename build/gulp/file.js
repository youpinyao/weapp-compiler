const gulpTask = require('./task');

module.exports = async function gulpSass(from, to) {
  return gulpTask(
    from,
    to,
  );
};
