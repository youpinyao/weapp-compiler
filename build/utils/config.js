const path = require('path');
const fse = require('fs-extra');
const configPath = path.resolve(process.cwd(), '.weapp.json');

module.exports = () => {
  if (!fse.existsSync(configPath)) {
    fse.writeFileSync(
      configPath,
      JSON.stringify(
        {
          output: 'dist',
          context: 'src',
          modules: {},
          ignoreExpression: [],
          ignore: [],
          alias: {},
        },
        null,
        2,
      ),
    );
  }
  const config = fse.readJSONSync(configPath);

  // 默认值， 并且转换
  config.output = path.resolve(process.cwd(), config.output || 'dist');
  config.context = path.resolve(process.cwd(), config.context || 'src');
  config.ignore = (config.ignore || []).map((item) => path.resolve(config.output, item));
  config.ignoreExpression = config.ignoreExpression || [];
  config.modules = config.modules || {};
  config.alias = config.alias || {};

  return config;
};
