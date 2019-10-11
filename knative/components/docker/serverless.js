'use strict';

/* eslint-disable camelcase */

const path = require('path');
const { mergeDeepRight } = require('ramda');
const { KubeConfig, Client1_13 } = require('kubernetes-client');
const { Component } = require('@serverless/core');

const defaults = {
  // TODOL: we might want to pass this in via `context.credentials`
  kubeConfigPath: path.join(process.env.HOME, '.kube', 'config'),
  version: '1.13',
};

class KnativeBuild extends Component {
  async default(inputs = {}) {
    const config = mergeDeepRight(defaults, inputs);

    const client = this.getClient(config.kubeConfigPath);

    await this.install;
    await this.installTektonPipelines(client);

    this.state = config;

    await this.save();
    return this.state;
  }

  async remove() {
    this.context.status('Knative - Setup - remove()');

    this.state = {};

    await this.state();
    return {};
  }

  async setup() {
    const client = await // call kubernetes-client
    // TODO: implement
  }

  // "private" methods
  getClient(configPath, version) {
    const kubeconfig = new KubeConfig();
    kubeconfig.loadFromFile(configPath);
    const Request = require('kubernetes-client/backends/request');
    const backend = new Request({ kubeconfig });
    // TODO: this should be variable since the version number might change
    return new Client1_13({ backend, version });
  }

  async installTektonPipelines(client) {
    const res = await client.api.v1.namespaces.get();
    console.log(res);
  }
}

module.exports = KnativeSetup;
