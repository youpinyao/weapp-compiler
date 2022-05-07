module.exports = function isProjectConfig(filePath) {
  return /project\.config\.json/g.test(filePath);
};
