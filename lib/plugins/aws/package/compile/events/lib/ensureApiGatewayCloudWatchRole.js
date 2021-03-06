'use strict';

const { memoize } = require('lodash');
const { addCustomResourceToService } = require('../../../../customResources');

module.exports = memoize(provider => {
  const cfTemplate = provider.serverless.service.provider.compiledCloudFormationTemplate;
  const customResourceLogicalId = provider.naming.getCustomResourceApiGatewayAccountCloudWatchRoleResourceLogicalId();
  const customResourceFunctionLogicalId = provider.naming.getCustomResourceApiGatewayAccountCloudWatchRoleHandlerFunctionLogicalId();

  cfTemplate.Resources[customResourceLogicalId] = {
    Type: 'Custom::ApiGatewayAccountRole',
    Version: 1.0,
    Properties: {
      ServiceToken: {
        'Fn::GetAtt': [customResourceFunctionLogicalId, 'Arn'],
      },
    },
  };

  return addCustomResourceToService(provider, 'apiGatewayCloudWatchRole', [
    {
      Effect: 'Allow',
      Resource: {
        'Fn::Join': [':', ['arn:aws:iam:', { Ref: 'AWS::AccountId' }, 'role/*']],
      },
      Action: [
        'iam:AttachRolePolicy',
        'iam:CreateRole',
        'iam:ListAttachedRolePolicies',
        'iam:PassRole',
      ],
    },
    {
      Effect: 'Allow',
      Resource: 'arn:aws:apigateway:*::/account',
      Action: ['apigateway:GET', 'apigateway:PATCH'],
    },
  ]);
});
