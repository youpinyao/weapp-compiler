const fse = require('fs-extra');
const yaml = require('yaml');
const weappEnv = path.resolve(process.cwd(), '.weapp.env');

const ENV = {
  DEV: 'development',
  PROD: 'production',
  SIMULATION: 'simulation',
  UNKNOWN: 'unknown',
};

if (fse.existsSync(weappEnv)) {
  Object.assign(ENV, yaml.parse(fse.readFileSync(weappEnv).toString()));
}
module.exports = ENV;
