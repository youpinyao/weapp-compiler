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

  return config;
};
