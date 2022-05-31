const keepFiles = [/project\.config\.json/i, /project\.private\.config\.json/i];

module.exports = function isKeepFile(filePath) {
  return keepFiles.some((item) => item.test(filePath));
};
