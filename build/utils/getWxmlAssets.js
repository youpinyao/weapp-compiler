const htmlparser2 = require('htmlparser2');
const path = require('path');
const fse = require('fs-extra');
const getResourceAccept = require('../config/getResourceAccept');
const getContext = require('../config/getContext');

const context = getContext();

function getWxmlAssets(filePath, content) {
  const resolvePath = (attr, dir) => {
    // console.log('-------------');
    // console.log(attr, dir);
    // console.log('-------------');
    return new Promise((resolve) => {
      this.resolve(context, attr, async (err, result) => {
        let res = result;
        if (err) {
          if (await fse.pathExists(path.resolve(dir, attr))) {
            res = path.resolve(dir, attr);
            resolve(res);
          } else {
            // console.log('-------------');
            // console.log(attr);
            this.emitError(err);
            // this.emitWarning(err);
            // reject(err);
            resolve(res);
          }
        } else {
          resolve(res);
        }
      });
    });
  };
  return new Promise((resolve, reject) => {
    let allAttrs = [];
    const parser = new htmlparser2.Parser({
      onopentag: async (name, attributes) => {
        const reg = /url\(.*\)/g;
        const { style } = attributes;

        allAttrs = allAttrs.concat(
          Object.values({
            ...attributes,
            style: '',
          }),
        );

        if (style) {
          const styles = attributes.style.split(';');
          styles.forEach((styleItem) => {
            (styleItem.match(reg) || []).forEach((item) => {
              allAttrs.push(
                item
                  .replace(/^(url\(”)/g, '')
                  .replace(/^(url\(')/g, '')
                  .replace(/^(url\()/g, '')
                  .replace(/(“\)|'\)|\))$/g, ''),
              );
            });
          });
        }
      },
      onerror: (err) => {
        reject(err);
      },
      onend: async () => {
        const filteredAttrs = allAttrs
          .filter((item) => !!item)
          .filter((item) => !/^(http:|https:)/.test(item))
          .filter((item) => !/{{.*}}/g.test(item))
          .filter((item) => !/\+.*\+/g.test(item));

        const assets = filteredAttrs.filter((item) => getResourceAccept().test(item.split('?')[0]));
        const wxmls = allAttrs.filter((item) => /\.(wxs|wxml)$/g.test(item));

        const assetsImports = [];
        const wxmlsImports = [];

        for (let index = 0; index < wxmls.length; index += 1) {
          const attr = wxmls[index];
          const result = await resolvePath(attr, path.parse(filePath).dir);

          if (result) {
            wxmlsImports.push([attr, result]);
          }
        }

        for (let index = 0; index < assets.length; index += 1) {
          const attr = assets[index];
          const result = await resolvePath(attr, path.parse(filePath).dir);

          if (result) {
            assetsImports.push([attr, result]);
          }
        }

        resolve([assetsImports, wxmlsImports]);
      },
    });
    parser.write(content);
    parser.end();
  });
}

module.exports = getWxmlAssets;
