# weapp compiler with webpack5

## 安装

```node

npm i weapp-compiler@2.x -D
```

---

## 调试

#### 测试

```node
npm run dev
```
#### 预发

```node
npm run dev -s
```
#### 生产

```node
npm run dev -p
```

---

## 发布

#### 测试

```node
npm run build -d
```
## 预发

```node
npm run build -s
```

## 生产

```node
npm run build
```

---

## 配置文件 .weapp.js

```node
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
};
```

---

## project.config.json

```node
"packOptions": {
  "ignore": [
    {
      "type": "folder",
      "value": "assets"
    },
    {
      "type": "regexp",
      "value": "\\.map$"
    }
  ]
},
```
---

## .gitignore

```node
.temp
```
