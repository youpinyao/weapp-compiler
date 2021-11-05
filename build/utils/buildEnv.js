const getEnv = require('../config/getEnv');
const recordEnv = require('./recordEnv');

const ENV = getEnv();
let env = '';

function setBuildEnv({ mode, simulation }) {
  env = mode;

  if (simulation) {
    env = ENV.SIMULATION;
  }

  recordEnv({
    env,
  });
}

function getBuildEnv() {
  return env;
}

module.exports = {
  setBuildEnv,
  getBuildEnv,
};
