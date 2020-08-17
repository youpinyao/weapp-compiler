const path = require('path');
const fse = require('fs-extra');
const configPath = path.resolve(process.cwd(), '.weapp.json');

module.exports = () => {
  if (!fse.existsSync(configPath)) {
    fse.writeFileSync(
      configPath,
      JSON.stringify(
        {
          modules: {},
          output: 'dist',
          context: 'src',
        },
        '',
        '\t',
      ),
    );
  }
  const config = fse.readJSONSync(configPath);

  config.output = path.resolve(process.cwd(), config.output);
  config.context = path.resolve(process.cwd(), config.context);

  return config;
};
