#!/usr/bin/env node

const args = process.argv;
const type = args[2];
const compiler = {
  dev: require('./compiler/development'),
  build: require('./compiler/production'),
}[type];

process.env.NODE_ENV = type !== 'build' ? 'development' : 'production';

compiler();
