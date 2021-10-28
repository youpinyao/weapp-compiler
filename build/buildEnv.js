const { ENV } = require('./env');

let env = '';

function setBuildEnv({ mode, simulation }) {
  env = mode;

  if (simulation) {
    env = ENV.SIMU;
  }
}

function getBuildEnv() {
  return env;
}
module.exports = {
  setBuildEnv,
  getBuildEnv,
};
