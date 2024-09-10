function loadModule(file) {
  const timer = setTimeout(() => {
    throw new Error(`${file} loadModule 超时`);
  }, 2000);
  return new Promise((resolve) => {
    this.addDependency(file);
    this.loadModule(file, (err, src) => {
      clearTimeout(timer);
      if (err) {
        // console.log();
        // console.log(file, this.resourcePath);
        // console.log();
        this.emitError(err);
        // this.emitWarning(err);
        // reject(err);
        resolve(src);
      } else {
        resolve(src);
      }
    });
  });
}
module.exports = loadModule;
