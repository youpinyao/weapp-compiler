const gulpTask = require('./task');

module.exports = async function gulpFile(from, to) {
  return gulpTask(
    from,
    to,
  );
};
