const getEnv = require('../config/getEnv');
const recordEnv = require('./recordEnv');

const ENV = getEnv();
let env = '';

function setBuildEnv({ mode, development, simulation }) {
  env = mode;

  if (development) {
    env = ENV.DEV;
  }
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
