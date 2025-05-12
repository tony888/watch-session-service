import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import env from "../config/env";
import { WatchSessionDB } from "./dynamodb";
import { EventBridge } from "./event-bridge";
import { LambdaApp } from "./lambda";
import { StepFunction } from "./step-function";
import { EventBus } from "aws-cdk-lib/aws-events";

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const db = new WatchSessionDB(this, "watch-session-db");

    const lambdaApp = new LambdaApp(this, "watch-session-lambda");

    const bucketName = `watch-session-${env.ENV}`;

    const eventBus = new EventBridge(this, "watch-session-eventbridge", {
      bucketName: bucketName,
    });

    const s3FileCreatedRule = new cdk.aws_events.Rule(
      this,
      "watch-session-file-created-forward-rule",
      {
        ruleName: `watch-session-file-created-forward-rule-${env.ENV}`,
        eventBus: EventBus.fromEventBusName(this, "default-bus", "default"),
        eventPattern: {
          source: ["aws.s3"],
          detailType: ["Object Created"],
          detail: {
            bucket: {
              name: [bucketName],
            },
          },
        },
      },
    );

    s3FileCreatedRule.addTarget(
      new cdk.aws_events_targets.EventBus(eventBus.eventBus),
    );

    const stepFuntion = new StepFunction(this, "watch-session-stepfunction", {
      lambda: lambdaApp.lambda,
    });

    lambdaApp.lambda.grantInvoke(stepFuntion.stateMachine);

    const stepFunctionTarget = new cdk.aws_events_targets.SfnStateMachine(
      stepFuntion.stateMachine,
    );

    eventBus.rule.addTarget(stepFunctionTarget);

    db.table.grantReadWriteData(lambdaApp.lambda);

    cdk.aws_s3.Bucket.fromBucketName(
      this,
      `watch-session-s3-bucket-${env.ENV}`,
      bucketName,
    ).grantRead(lambdaApp.lambda);
  }
}
