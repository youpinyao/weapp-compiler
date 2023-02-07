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
          ignoreBabelExpression: [],
          ignoreExpression: [],
          ignore: [],
          alias: {},
          eslint: false,
          babel: true,
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
  config.ignoreBabelExpression = config.ignoreBabelExpression || [];
  config.modules = config.modules || {};
  config.alias = config.alias || {};

  // 生成输出地址
  if (!fse.existsSync(config.output)) {
    fse.mkdirSync(config.output);
  }

  return config;
};