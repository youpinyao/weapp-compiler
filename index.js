#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const fs = require('fs');
const dev = require('./build/dev');
const prod = require('./build/prod');
const { setBuildEnv } = require('./build/utils/buildEnv');
const ENV = require('./build/config/env');
const chooseSubpackages = require('./build/utils/chooseSubpackages');

const { version } = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, './package.json')).toString(),
);
const compiler = {
  dev,
  prod,
};

program.version(version);
program.option('-a, --analyzer', 'webpack-bundle-analyzer');
program.option('-s, --simulation', 'process.env.BUILD_ENV = simulation');
program.option('-d, --development', 'process.env.BUILD_ENV = development');
program.option('-p, --production', 'process.env.BUILD_ENV = production');
program.option('-e, --environment <env>', '自定义环境，或者simulation，development或production');
program.option('-q, --quiet', '安静模式，打印减少');
program.option('-sm, --source-map', 'source-map');
program.option('-dm, --dev-mode <devMode>', '开发模式：all 全部构建，custom 部分构建');

program.command('dev').action(async () => {
  await chooseSubpackages(program.opts().devMode);
  setBuildEnv({
    mode: ENV.DEV,
    ...program.opts(),
  });
  compiler.dev(program.opts());
});
program.command('build').action(() => {
  setBuildEnv({
    mode: ENV.PROD,
    ...program.opts(),
  });
  compiler.prod(program.opts());
});

program.parse(process.argv);
