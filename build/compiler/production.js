
const getConfig = require('../utils/config');
const getFiles = require('../utils/files');
const compiler = require('./compiler');
const moduleSync = require('./module');
const { clearOutput } = require('../utils/clear');

module.exports = async () => {
  clearOutput();
  await moduleSync();
  await compiler(getFiles(getConfig().context));
};
