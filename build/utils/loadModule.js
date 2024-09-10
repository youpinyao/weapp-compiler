function loadModule(file) {
  return new Promise((resolve) => {
    this.addDependency(file);
    this.loadModule(file, (err, src) => {
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
