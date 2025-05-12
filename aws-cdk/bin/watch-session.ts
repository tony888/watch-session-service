#!/opt/homebrew/opt/node/bin/node
import * as cdk from "aws-cdk-lib";
import "dotenv/config";
import { get } from "env-var";
import "source-map-support/register";
import env from "../config/env";
import { ApiGatewayStack } from "../lib/api-gw-stack";
import { BackendStack } from "../lib/backend-stack";

const app = new cdk.App();

cdk.Tags.of(app).add("Owner", get("OWNER").required().asString());
cdk.Tags.of(app).add("Project", get("PROJECT").required().asString());
cdk.Tags.of(app).add("SubProject", get("SUB_PROJECT").required().asString());
cdk.Tags.of(app).add("Env", process.env.NODE_ENV || "development");

const serviceName = "watch-session";

const stack1 = new ApiGatewayStack(
  app,
  `${serviceName}-apigateway-stack-${env.ENV}`,
  {
    env: {
      region: env.CDK_DEFAULT_REGION,
      account: env.CDK_DEFAULT_ACCOUNT,
    },
  },
);

const stack2 = new BackendStack(
  app,
  `${serviceName}-backend-stack-${env.ENV}`,
  {
    env: {
      region: env.CDK_DEFAULT_REGION,
      account: env.CDK_DEFAULT_ACCOUNT,
    },
  },
);

stack1.addDependency(stack2);

app.synth();
