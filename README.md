# weapp webpack

## 安装

```node
npm i youpinyao-weapp-webpack -D
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
  }
}
```
