// require modules
const fse = require('fs-extra');
const path = require('path');
const dayjs = require('dayjs');
const archiver = require('archiver');
const { getBuildEnv } = require('./buildEnv');
const getPackage = require('../config/getPackage');
const getAssets = require('../config/getAssets');
const { addToUploadQueue } = require('./upload');
const getOutput = require('../config/getOutput');
const getConfig = require('../config/getConfig');

module.exports = function archiverAndUploadToObsOrOss() {
  // create a file to stream archive data to.
  const outputDir = path.resolve(
    process.cwd(),
    `${getPackage().name}_${getBuildEnv()}_${dayjs().format('YYYY-MM-DD_HH:mm:ss')}.zip`,
  );
  const output = fse.createWriteStream(outputDir);
  const archive = archiver('zip', {
    zlib: { level: 9 }, // Sets the compression level.
  });

  // listen for all archive data to be written
  // 'close' event is fired only when a file descriptor is involved
  output.on('close', () => {
    console.log(`${archive.pointer()} total bytes`);
    console.log('archiver has been finalized and the output file descriptor has closed.');
    console.log(
      path
        .join(getConfig().publicPath, path.relative(process.cwd(), outputDir))
        .replace(':/', '://'),
    );
    fse.moveSync(outputDir, path.join(getOutput(), path.relative(process.cwd(), outputDir)));
    addToUploadQueue([path.relative(process.cwd(), outputDir)]);
  });

  // This event is fired when the data source is drained no matter what was the data source.
  // It is not part of this library but rather from the NodeJS Stream API.
  // @see: https://nodejs.org/api/stream.html#stream_event_end
  output.on('end', () => {
    console.log('Data has been drained');
  });

  // good practice to catch warnings (ie stat failures and other non-blocking errors)
  archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
      // log warning
    } else {
      // throw error
      throw err;
    }
  });

  // good practice to catch this error explicitly
  archive.on('error', (err) => {
    throw err;
  });

  // pipe archive data to the file
  archive.pipe(output);

  archive.glob('**', {
    ignore: [`${getAssets()}/**`],
    cwd: path.resolve(process.cwd(), 'dist'),
  });

  archive.finalize();
};
