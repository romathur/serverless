'use strict';

const { Component } = require('@serverless/core');

class KnativeEventing extends Component {
  async default(inputs = {}) {
    this.context.status('Knative - Eventing - default()');

    this.state.inputs = inputs;
    this.state.componentName = 'KnativeEventing';

    await this.save();
    return this.state;
  }

  async remove() {
    this.context.status('Knative - Eventing - remove()');

    this.state = {};

    await this.state();
    return {};
  }
}

module.exports = KnativeEventing;
