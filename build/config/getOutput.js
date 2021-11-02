const path = require('path');

function getOutput() {
  return path.resolve(process.cwd(), 'dist');
}

module.exports = getOutput;
