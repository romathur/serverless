'use strict';

const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const BbPromise = require('bluebird');
const AWS = require('aws-sdk');
const stripAnsi = require('strip-ansi');
const { expect } = require('chai');
const { execSync } = require('../utils/child-process');
const { getTmpDirPath } = require('../utils/fs');
const { region, getServiceName } = require('../utils/misc');

const serverlessExec = path.join(__dirname, '..', '..', 'bin', 'serverless');

const CF = new AWS.CloudFormation({ region });

describe('Service Lifecyle Integration Test', function() {
  this.timeout(1000 * 60 * 10); // Involves time-taking deploys
  const templateName = 'aws-nodejs';
  const tmpDir = getTmpDirPath();
  let serviceName;
  let StackName;

  before(() => {
    serviceName = getServiceName();
    StackName = `${serviceName}-dev`;
    fse.mkdirsSync(tmpDir);
  });

  it('should create service in tmp directory', () => {
    execSync(`${serverlessExec} create --template ${templateName} --name ${serviceName}`, {
      cwd: tmpDir,
    });
    expect(fs.existsSync(path.join(tmpDir, 'serverless.yml'))).to.be.equal(true);
    expect(fs.existsSync(path.join(tmpDir, 'handler.js'))).to.be.equal(true);
  });

  it('should deploy service to aws', () => {
    execSync(`${serverlessExec} deploy`, { cwd: tmpDir });

    return CF.describeStacks({ StackName })
      .promise()
      .then(d => expect(d.Stacks[0].StackStatus).to.be.equal('UPDATE_COMPLETE'));
  });

  it('should invoke function from aws', () => {
    const invoked = execSync(`${serverlessExec} invoke --function hello --noGreeting true`, {
      cwd: tmpDir,
    });
    const result = JSON.parse(Buffer.from(invoked, 'base64').toString());
    // parse it once again because the body is stringified to be LAMBDA-PROXY ready
    const message = JSON.parse(result.body).message;
    expect(message).to.be.equal('Go Serverless v1.0! Your function executed successfully!');
  });

  it('should deploy updated service to aws', () => {
    const newHandler = `
        'use strict';

        module.exports.hello = (event, context, cb) => cb(null,
          { message: 'Service Update Succeeded' }
        );
      `;

    fs.writeFileSync(path.join(tmpDir, 'handler.js'), newHandler);
    execSync(`${serverlessExec} deploy`, { cwd: tmpDir });
  });

  it('should invoke updated function from aws', () => {
    const invoked = execSync(`${serverlessExec} invoke --function hello --noGreeting true`, {
      cwd: tmpDir,
    });
    const result = JSON.parse(Buffer.from(invoked, 'base64').toString());
    expect(result.message).to.be.equal('Service Update Succeeded');
  });

  it('should list existing deployments and roll back to first deployment', () => {
    let timestamp;
    const listDeploys = execSync(`${serverlessExec} deploy list`, { cwd: tmpDir });
    const output = stripAnsi(listDeploys.toString());
    const match = output.match(new RegExp('Datetime: (.+)'));
    if (match) {
      timestamp = match[1];
    }
    // eslint-disable-next-line no-unused-expressions
    expect(timestamp).to.not.undefined;

    execSync(`${serverlessExec} rollback -t ${timestamp}`, { cwd: tmpDir });

    const invoked = execSync(`${serverlessExec} invoke --function hello --noGreeting true`, {
      cwd: tmpDir,
    });
    const result = JSON.parse(Buffer.from(invoked, 'base64').toString());
    // parse it once again because the body is stringified to be LAMBDA-PROXY ready
    const message = JSON.parse(result.body).message;
    expect(message).to.be.equal('Go Serverless v1.0! Your function executed successfully!');
  });

  it('should remove service from aws', () => {
    execSync(`${serverlessExec} remove`, { cwd: tmpDir });

    return CF.describeStacks({ StackName })
      .promise()
      .then(d => expect(d.Stacks[0].StackStatus).to.be.equal('DELETE_COMPLETE'))
      .catch(error => {
        if (error.message.indexOf('does not exist') > -1) return BbPromise.resolve();
        throw new Error(error);
      });
  });
});
