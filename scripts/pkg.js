#!/usr/bin/env node

// Node.js v8+ only

'use strict';

Error.stackTraceLimit = Infinity;
process.on('unhandledRejection', error => {
  throw error;
});

const path = require('path');
const spawn = require('child-process-ext/spawn');
const BbPromise = require('bluebird');
const fse = BbPromise.promisifyAll(require('fs-extra'));

const serverlessPath = path.join(__dirname, '..');
const pkgJsonPath = path.join(serverlessPath, 'package.json');
const spawnOptions = {
  cwd: serverlessPath,
  stdio: 'inherit',
};

(async () => {
  process.stdout.write('Install npm\n');
  const originalPkgJsonBuffer = await fse.readFileAsync(pkgJsonPath);
  await spawn('npm', ['install', 'npm@6'], spawnOptions);

  process.stdout.write('Tweak package.json\n');
  const pkgJson = JSON.parse(originalPkgJsonBuffer);
  pkgJson.files = [
    'lib',
    'node_modules/npm/bin/npm-cli.js',
    'node_modules/node-gyp/bin/node-gyp.js',
    'node_modules/npm/node_modules/node-gyp/bin/node-gyp.js',
    'node_modules/npm/node_modules/npm-lifecycle/node_modules/node-gyp/bin/node-gyp.js',
  ];
  await fse.writeJsonAsync(pkgJsonPath, pkgJson);

  process.stdout.write('Build binaries\n');
  try {
    await spawn(
      'node',
      ['node_modules/.bin/pkg', '--out-path', 'dist', '-t', 'node12-macos-x64', pkgJsonPath],
      spawnOptions
    );
  } finally {
    await fse.writeFileAsync(pkgJsonPath, originalPkgJsonBuffer);
  }
})();
