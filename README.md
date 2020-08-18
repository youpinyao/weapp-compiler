# weapp webpack

## 功能

- [x] sass解析
- [x] less解析
- [x] alias 别名解析


## 安装

```node
npm i weapp-compiler -D
```

## 调试

```node
weapp dev
```

## 构建

```node
weapp build
```


## 配置文件

```node
.weapp.json

{
  // 项目目录
  "context": "src",
  // 输出目录
  "output": "dist",
  // npm模块同步，npm路径 => output路径
  "modules": {
    "vant-weapp/dist": "vant-weapp"
  },
  // 忽略文件夹
  "ignore": [
    "vant-weapp/badge"
  ],
  // 别名
  "alias": {
    "@utils": path.resolve(process.cwd(), 'src/utils')
  }
}
```
