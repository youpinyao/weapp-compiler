#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const fs = require('fs');
const dev = require('./build/dev');
const prod = require('./build/prod');

const { version } = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, './package.json')).toString(),
);
const compiler = {
  dev,
  prod,
};

program.version(version);
program.option('-a, --analyzer', 'webpack-bundle-analyzer');

program.command('dev').action(() => {
  compiler.dev(program.opts());
});
program.command('build').action(() => {
  compiler.prod(program.opts());
});

program.parse(process.argv);
