/* eslint-disable no-use-before-define */

const path = require('path');
const execSync = require('child_process').execSync;

const { findServerlessFiles, createDag } = require('./utils');

function remove() {
  const serverlessFilePaths = findServerlessFiles();
  const dag = createDag(serverlessFilePaths);

  return walkGraph(dag);
}

function walkGraph(dag) {
  dag.overallOrder().reverse().forEach((serviceFilePath) => {
    // TODO: extend so that other serverless files are detected as well
    const servicePath = serviceFilePath.replace(path.join(path.sep, 'serverless.yml'), '');

    try {
      execSync(`${process.argv[1]} remove`, { cwd: servicePath, stdio: 'inherit' });
    } catch (error) {
      console.log(error.message); // eslint-disable-line no-console
    }
  });
}

module.exports = remove;