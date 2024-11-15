const ENV = require('../config/env');
const recordEnv = require('./recordEnv');

let env = '';

function setBuildEnv({ mode, development, simulation, production, environment }) {
  env = mode;

  if (development) {
    env = ENV.DEV;
  }
  if (simulation) {
    env = ENV.SIMULATION;
  }
  if (production) {
    env = ENV.PROD;
  }
  if (environment) {
    env = environment;
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
