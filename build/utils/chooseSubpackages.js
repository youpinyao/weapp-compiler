const inquirer = require('inquirer');
const { getAppConfig, setAppConfig } = require('../config/appConfig');

async function chooseSubpackages(devMode) {
  const appConfig = getAppConfig();
  const subpackages = appConfig.subpackages || [];
  let type = devMode;

  if (!type) {
    type = (
      await inquirer.prompt({
        type: 'list',
        name: 'type',
        message: '请选择要构建方式',
        choices: [
          {
            name: '主包+所有分包',
            value: 'all',
          },
          {
            name: '主包+自定义分包',
            value: 'custom',
          },
        ],
      })
    ).type;
  }

  if (type === 'custom') {
    {
      const custom = await inquirer.prompt({
        type: 'checkbox',
        name: 'subpackages',
        message: '请选择需要构建的包',
        loop: false,
        pageSize: subpackages.length + 1,
        choices: [
          {
            name: '主包',
            value: 'app',
            checked: true,
            disabled: true,
          },
          ...subpackages.map((item) => {
            return {
              name: item.root,
              value: item.root,
            };
          }),
        ],
      });
      setAppConfig({
        ...appConfig,
        subpackages: subpackages.filter((item) => {
          return custom.subpackages.includes(item.root);
        }),
      });
    }
  }
}

module.exports = chooseSubpackages;
