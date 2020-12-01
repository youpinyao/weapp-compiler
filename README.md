# weapp compiler

## 功能

- [x] less解析
- [x] alias 别名解析
- [x] node_modules 模块手动同步（通过配置 modules 参数）
- [x] node_modules 模块自动同步（自动匹配node_modules下依赖）
- [x] eslint js校验
- [x] babel


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
  // eslint 校验功能开关
  "eslint": false,
  // npm模块同步，node_modules路径 => output路径
  "modules": {
    "vant-weapp/dist": "vant-weapp"
  },
  // 忽略正则表达式
  "ignoreExpression": [
    "(.d.ts)$"
  ],
  // 忽略文件夹
  "ignore": [
    "vant-weapp/badge"
  ],
  // 别名，支持：require import src url alias(@utils)
  "alias": {
    "@utils": "utils"
  }
}
```
