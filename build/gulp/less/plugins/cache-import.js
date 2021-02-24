const fse = require('fs-extra');
const cacheRelate = {};

function CacheImport(options) {
  this.options = options;
}
function CheckImport(options) {
  this.options = options;
}

CheckImport.prototype = {
  process: function (css, extra) {
    let { files } = extra.imports;

    if (!files.forEach) {
      files = Object.keys(files);
    }
    if (files && files.forEach) {
      files.forEach((file) => {
        if (!cacheRelate[file]) {
          cacheRelate[file] = {
            [this.options.from]: this.options,
          };
        } else {
          cacheRelate[file][this.options.from] = this.options;
        }
      });
    }
    return css;
  },
};

CacheImport.prototype = {
  install: function (less, pluginManager) {
    pluginManager.addPostProcessor(new CheckImport(this.options));
  },
  setOptions: function (argumentString) {
    /* optional */
    // console.log('setOptions', argumentString);
  },
  printUsage: function () {
    /* optional */
    // console.log('printUsage');
  },
  minVersion: [2, 0, 0] /* optional */,
};

function checkCache(from, update = () => {}) {
  // console.log(cacheRelate, from);
  Object.keys(cacheRelate[from] || {}).forEach(async (iKey) => {
    const opt = cacheRelate[from][iKey];

    if (fse.existsSync(iKey)) {
      update(opt);
    }
  });
}

module.exports = {
  CacheImport,
  checkCache,
};
