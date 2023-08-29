const chalk = require('chalk');
const fse = require('fs-extra');
const path = require('path');

const weapp = path.resolve(process.cwd(), '.weapp.js');

let config = {};

if (fse.existsSync(weapp)) {
  // eslint-disable-next-line
  config = require(weapp);
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
// 阿里OSS配置
ossConfig: {
  region: '<Your region>',
  accessKeyId: '<Your AccessKeyId>',
  accessKeySecret: '<Your AccessKeySecret>',
  bucket: '<Your Bucket>',
  dir: 'weapp-compiler-test',
},
// webpack 配置
configureWebpack: {},
// 字符串或函数 (filePath: string) => string
pageWxmlInject: '',
};
`),
  );
}
const alias = {
  ...(config.alias || {}),
};
Object.keys(config.alias || {}).forEach((key) => {
  alias[`alias(${key})`] = alias[key];
});

function getConfig() {
  return {
    ...config,
    alias,
  };
}

module.exports = getConfig;
