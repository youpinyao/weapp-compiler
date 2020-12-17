#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const fs = require('fs');
const { version } = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json')).toString());
const compiler = {
  dev: require('./compiler/development'),
  build: require('./compiler/production'),
};

program.version(version);
program.command('dev').action((...args) => {
  process.env.NODE_ENV = 'development';
  compiler.dev();
});
program.command('build').action((...args) => {
  process.env.NODE_ENV = 'production';
  compiler.build();
});

program.parse(process.argv);
