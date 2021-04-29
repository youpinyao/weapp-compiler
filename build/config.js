const path = require('path');
const fse = require('fs-extra');
const chalk = require('chalk');
const traverseDir = require('./traverseDir');

const entry = path.resolve(process.cwd(), 'src');
const weapp = path.resolve(process.cwd(), '.weapp.js');
const appConfig = fse.readJSONSync(path.resolve(entry, 'app.json'));
let projectConfig = {};

if (fse.existsSync(weapp)) {
  // eslint-disable-next-line
  projectConfig = require(weapp);
} else {
  throw Error(
    chalk.green(`
请在项目根目录新建 .weapp.js 配置文件

内容如下：

const path = require('path');

module.exports = {
  // 路径别名
  alias: {
    '@utils': path.resolve(__dirname, 'src/utils'),
    '@config': path.resolve(__dirname, 'src/config'),
    '@template': path.resolve(__dirname, 'src/template'),
    '@images': path.resolve(__dirname, 'src/images'),
    '@obsimage': path.resolve(__dirname, 'src/wxs_fila/images'),
    '@obs': path.resolve(__dirname, 'src/wxs_fila'),
    '@obsjson': path.resolve(__dirname, 'src/wxs_fila/json'),
  },
  // 资源公共路径
  publicPath: 'https://img.test.com/weapp-compiler-test/',
  // 要同步的目录
  copyFiles: [{
    from: 'images',
    to: 'images',
  }],
  // 华为OBS配置
  obsConfig: {
    access_key_id: 'XXXXXXXX',
    secret_access_key: 'XXXXXXXX',
    server: 'XXXXXXXX',
    bucket: 'XXXXXXXX',
    dir: 'weapp-compiler-test',
  },
};


  `),
  );
}

const alias = {
  ...(projectConfig.alias || {}),
};
Object.keys(projectConfig.alias || {}).forEach((key) => {
  alias[`alias(${key})`] = alias[key];
});
module.exports = {
  entry,
  output: path.resolve(process.cwd(), 'dist'),
  ...projectConfig,
  alias,
  app: appConfig,
  assets: 'assets',
  isSubpackage(file) {
    let isSub = false;
    (appConfig.subpackages || []).forEach((pkg) => {
      let { root } = pkg;

      if (!/\/$/g.test(root)) {
        root = `${root}/`;
      }

      if (file.indexOf(root) === 0 || file.indexOf(root.replace(/\//g, '\\')) === 0) {
        isSub = true;
      }
    });
    return isSub;
  },
  entrys: (() => {
    const entrys = {
      app: path.resolve(entry, 'app'),
    };
    const addUsingComponents = (components, parent) => {
      Object.keys(components).forEach((key) => {
        let filePath = components[key];

        if (!/^(plugin:|plugin-private:|weui-miniprogram)/g.test(filePath)) {
          if (/^\//g.test(filePath)) {
            filePath = path.resolve(entry, filePath.replace(/^\//g, ''));
          }

          if (fse.existsSync(`${path.resolve(parent, filePath)}.js`)) {
            filePath = path.resolve(parent, filePath);
          } else {
            try {
              filePath = require.resolve(filePath);
              filePath = filePath.replace(/(\.js)$/g, '');
            } catch (error) {
              console.error(error);
            }
          }

          if (fse.existsSync(`${filePath}.json`)) {
            // eslint-disable-next-line
            readUsingComponents(`${filePath}.json`);
          }

          entrys[
            /\/node_modules\//g.test(filePath)
              ? filePath.split('/node_modules/')[1]
              : path.relative(entry, filePath)
          ] = filePath;
        }
      });
    };
    const readUsingComponents = (file) => {
      const json = fse.readJSONSync(file);

      if (json.usingComponents) {
        addUsingComponents(json.usingComponents, path.parse(file).dir);
      }
    };

    // pages
    (appConfig.pages || []).forEach((page) => {
      entrys[page] = path.resolve(entry, page);
    });

    // tabbar
    if (fse.existsSync(path.resolve(entry, 'custom-tab-bar/index.js'))) {
      entrys['custom-tab-bar/index'] = path.resolve(entry, 'custom-tab-bar/index');
    }

    // subpackages
    (appConfig.subpackages || []).forEach((pkg) => {
      (pkg.pages || []).forEach((page) => {
        entrys[path.join(pkg.root, page)] = path.resolve(entry, pkg.root, page);
      });
    });

    // usingComponents
    traverseDir(entry).forEach((item) => {
      if (/(\.json)$/g.test(item)) {
        readUsingComponents(item);
      }
    });

    // fse.writeJSONSync(path.resolve(process.cwd(), 'entrys.json'), entrys);
    return entrys;
  })(),
};
