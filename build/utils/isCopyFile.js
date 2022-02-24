let copys = [];
function isCopyFile(name) {
  return copys.filter((item) => name.startsWith(item.from)).length > 0;
}
function setCopyFiles(data) {
  copys = data;
}

module.exports = {
  isCopyFile,
  setCopyFiles,
};
