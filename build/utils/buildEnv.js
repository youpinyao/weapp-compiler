const getEnv = require('../config/getEnv');

const ENV = getEnv();
let env = '';

function setBuildEnv({ mode, simulation }) {
  env = mode;

  if (simulation) {
    env = ENV.SIMULATION;
  }
}

function getBuildEnv() {
  return env;
}

module.exports = {
  setBuildEnv,
  getBuildEnv,
};
