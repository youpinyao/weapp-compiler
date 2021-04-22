const path = require('path');
const htmlparser2 = require('htmlparser2');
const fse = require('fs-extra');
// const chalk = require('chalk');

const { entrys, entry } = require('../config');

function resolvePath(file, dir) {
  return new Promise((resolve, reject) => {
    this.resolve(entry, file, (err, result) => {
      let res = result;
      if (err) {
        // this.emitError(err);
        // this.emitWarning(err);
        if (fse.existsSync(path.resolve(dir, file))) {
          res = path.resolve(dir, file);
        }
      }
      resolve(res);
    });
  });
}

function getWxmlResource(file) {
  return new Promise((resolve, reject) => {
    if (!fse.existsSync(file)) {
      resolve([]);
      return;
    }
    let allAtrrs = [];
    const parser = new htmlparser2.Parser({
      onopentag: async (name, attributes) => {
        const reg = /url\(.*\)|url\('.*'\)|url\(".*"\)/g;
        allAtrrs = allAtrrs.concat(Object.values(attributes));

        if (attributes.style) {
          (attributes.style.match(reg) || []).forEach((item) => {
            allAtrrs.push(
              item.replace(/^(url\(|url\('|url\(")/g, '').replace(/(\)|'\)|"\))$/g, ''),
            );
          });
        }
      },
      onerror: (err) => {
        reject(err);
      },
      onend: async () => {
        const assets = allAtrrs
          .filter((item) => /\.(png|svg|jpg|gif|jpeg)$/g.test(item.split('?')[0]))
          .filter((item) => !/^(http:|https:)/.test(item));
        const wxmls = allAtrrs
          .filter((item) => /\.(wxs|wxml)$/g.test(item))
          .filter((item) => !/^(http:|https:)/.test(item));

        const imports = [];
        const wxmlsImports = [];

        for (let index = 0; index < wxmls.length; index += 1) {
          const attr = wxmls[index];
          const result = await resolvePath.bind(this)(attr, path.parse(file).dir);

          if (result) {
            wxmlsImports.push([attr, result]);
          }
        }

        for (let index = 0; index < assets.length; index += 1) {
          const attr = assets[index];
          const result = await resolvePath.bind(this)(attr, path.parse(file).dir);

          if (result) {
            imports.push([attr, result]);
          }
        }

        resolve([imports, wxmlsImports]);
      },
    });
    parser.write(fse.readFileSync(file).toString());
    parser.end();
  });
}

function withPublicPath(str, publicPath) {
  return `${publicPath === 'auto' ? '' : publicPath}${str.match(/"(.*)"/g)[0].replace(/"/g, '')}`;
}

function loadModule(file) {
  this.addDependency(file);
  return new Promise((resolve, reject) => {
    this.loadModule(file, (err, src) => {
      if (err) {
        // console.log();
        // console.log(file, this.resourcePath);
        // console.log();
        // this.emitError(err);
      }
      resolve(src);
    });
  });
}

module.exports = async function loader(source) {
  this.cacheable(true);
  const callback = this.async();
  const filePath = this.resourcePath;
  let sourceStr = source.toString();
  const fileInfo = path.parse(filePath);
  const {
    _compiler: {
      options: {
        output: { publicPath },
      },
    },
  } = this;
  let imports = '';

  if (
    fileInfo.ext === '.js' &&
    Object.values(entrys).indexOf(path.resolve(fileInfo.dir, fileInfo.name)) !== -1
  ) {
    const exts = ['.less', '.wxss', '.css', '.json', '.wxml'];

    for (let index = 0; index < exts.length; index += 1) {
      const ext = exts[index];
      const otherFilePath = path.resolve(fileInfo.dir, fileInfo.name + ext);

      if (fse.existsSync(otherFilePath)) {
        imports += `import './${fileInfo.name}${ext}'\n`;
        // loadModule.bind(this)(otherFilePath);
      }
    }
  }
  if (fileInfo.ext === '.wxml') {
    const [assets, wxmls] = await getWxmlResource.bind(this)(filePath);

    // console.log(filePath);
    // console.log(assets, wxmls);

    // 资源文件
    for (let index = 0; index < assets.length; index += 1) {
      const [attr, file] = assets[index];
      const src = await loadModule.bind(this)(file);

      sourceStr = sourceStr.replace(attr, withPublicPath(src, publicPath));
    }

    // wxml文件
    for (let index = 0; index < wxmls.length; index += 1) {
      const [, file] = wxmls[index];

      loadModule.bind(this)(file);
    }
  }

  // tabBar 不支持网络图片，处理

  // if (fileInfo.ext === '.json' && filePath === path.resolve(entry, 'app.json')) {
  //   const appConfig = JSON.parse(sourceStr);

  //   if (appConfig.tabBar && appConfig.tabBar.list) {
  //     for (let i = 0; i < appConfig.tabBar.list.length; i += 1) {
  //       const item = appConfig.tabBar.list[i];
  //       let { iconPath, selectedIconPath } = item;

  //       iconPath = path.resolve(entry, iconPath);
  //       selectedIconPath = path.resolve(entry, selectedIconPath);

  //       if (iconPath) {
  //         appConfig.tabBar.list[i].iconPath = withPublicPath(
  //           await loadModule.bind(this)(iconPath),
  //           'auto',
  //         );
  //       }
  //       if (selectedIconPath) {
  //         appConfig.tabBar.list[i].selectedIconPath = withPublicPath(
  //           await loadModule.bind(this)(selectedIconPath),
  //           'auto',
  //         );
  //       }
  //     }
  //   }
  //   sourceStr = JSON.stringify(appConfig, null, 2);
  // }

  if (fileInfo.ext === '.wxs') {
    const requires = sourceStr.match(/require\(("|').*("|')\)/g);

    (requires || []).forEach((item) => {
      const file = path.resolve(
        fileInfo.dir,
        item.replace(/^((require\(')|(require\("))/g, '').replace(/(('\))|("\)))$/g, ''),
      );
      loadModule.bind(this)(file);
    });
  }

  callback(null, `${imports}${sourceStr}`);
};

module.exports.raw = true;
