#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const fs = require('fs');
const dev = require('./build/dev');
const prod = require('./build/prod');
const { setBuildEnv } = require('./build/buildEnv');
const { ENV } = require('./build/env');

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

program.command('dev').action(() => {
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
