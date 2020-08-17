const chalk = require('chalk');

const getConfig = require('../utils/config');
const getFiles = require('../utils/files');
const compiler = require('./compiler');
const copyModuleSync = require('../utils/module');
const { clearOutput } = require('../utils/clear');

module.exports = async () => {
  clearOutput();
  await copyModuleSync();
  await compiler(getFiles(getConfig().context));
};
