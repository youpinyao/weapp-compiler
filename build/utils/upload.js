const path = require('path');
const OBSClient = require('esdk-obs-nodejs');
const OSSClient = require('ali-oss');
// const chalk = require('chalk');
const Progress = require('progress');
const getConfig = require('../config/getConfig');

const { getStorage, setStorage } = require('./storage');
const compatiblePath = require('./compatiblePath');
const getOutput = require('../config/getOutput');

const output = getOutput();
const { obsConfig, ossConfig } = getConfig();

let obsClient;
let ossClient;
let progress;
let uploadQueue = {};

function getObsClient() {
  if (!obsClient) {
    obsClient = new OBSClient({
      ...obsConfig,
    });
  }
  return obsClient;
}

function getOssClient() {
  if (!ossClient) {
    ossClient = new OSSClient({
      ...ossConfig,
    });
  }
  return ossClient;
}

function doOssUpload(file) {
  return getOssClient().put(
    compatiblePath(path.join(ossConfig.dir, path.relative(output, file))),
    file,
  );
}

function getOssStat(file) {
  return getOssClient().head(compatiblePath(path.join(ossConfig.dir, path.relative(output, file))));
}

function doObsUpload(file) {
  return new Promise((resolve, reject) => {
    getObsClient().putObject(
      {
        Bucket: obsConfig.bucket,
        Key: compatiblePath(path.join(obsConfig.dir, path.relative(output, file))),
        SourceFile: file,
      },
      (err, result) => {
        if (err) {
          reject(err);
          // console.log(chalk.red("上传失败"), file);
        } else if (result.CommonMsg.Status >= 300) {
          reject(err);
          // console.log(chalk.red("上传失败"), file);
        } else {
          resolve(result);
          // console.log(chalk.green("上传成功"), file);
        }
      },
    );
  });
}
async function getObsStat(file) {
  return new Promise((resolve, reject) => {
    getObsClient().getObjectMetadata(
      {
        Bucket: obsConfig.bucket,
        Key: compatiblePath(path.join(obsConfig.dir, path.relative(output, file))),
      },
      (err, result) => {
        if (err) {
          reject(err);
        } else if (result.CommonMsg.Status < 300) {
          resolve(result);
        } else {
          reject(result);
        }
      },
    );
  });
}

function getStat(file) {
  const isUploaded = !!getStorage(file);

  if (isUploaded) {
    return Promise.resolve();
  }

  if (ossConfig) {
    return getOssStat(file);
  }
  return getObsStat(file);
}

function doUpload(file) {
  if (ossConfig) {
    return doOssUpload(file);
  }
  return doObsUpload(file);
}

function updateProgress() {
  const completed =
    Object.entries(uploadQueue).filter((item) => item[1] === 'completed').length + 1;
  const total = Object.keys(uploadQueue).length;

  if (!progress) {
    progress = new Progress('uploading assets [:bar] :current/:total', {
      total,
      width: 40,
      clear: true,
    });
  }

  progress.tick();

  if (completed === total) {
    progress.tick({
      current: total,
    });
    progress = null;
    uploadQueue = {};
    // setTimeout(() => {
    //   console.log(chalk.green('assets upload completed'));
    // }, 0);
  }

  return `[${completed}/${total}]`;
}

async function checkUpload() {
  const files = Object.entries(uploadQueue)
    .filter((item) => item[1] === false)
    .splice(0, 10);

  if (files && files.length) {
    await Promise.all(
      files.map(async (file) => {
        uploadQueue[file[0]] = 'uploading';
        try {
          await getStat(file[0]);
          setStorage(file[0], true);
          updateProgress();
          // console.log(
          //   chalk.blue(`${publicPath}${path.relative(output, file[0])} ${updateProgress()}`),
          // );
        } catch (error) {
          await doUpload(file[0]);
          setStorage(file[0], true);
          updateProgress();
          // console.log(
          //   chalk.green(`${publicPath}${path.relative(output, file[0])} ${updateProgress()}`),
          // );
        }
        uploadQueue[file[0]] = 'completed';
      }),
    );

    checkUpload();
  }
}

function addToUploadQueue(assets) {
  if (!obsConfig && !ossConfig) {
    console.warn('请配置obsConfig 或 ossConfig，否则无法上传文件到obs 或 oss');
    return;
  }

  assets.forEach((asset) => {
    const file = path.resolve(output, asset);
    if (uploadQueue[file] === undefined) {
      uploadQueue[file] = false;
    }
  });
  checkUpload();
}

module.exports = {
  addToUploadQueue,
};
