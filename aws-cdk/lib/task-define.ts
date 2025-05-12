import { aws_dynamodb } from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as firehose from "aws-cdk-lib/aws-kinesisfirehose";
import { Construct } from "constructs";
import env from "../config/env";

interface TaskDefinitionProps {
  port: number;
  imagesRegistry: string;
  firehoseStream?: firehose.CfnDeliveryStream;
  ddbTableName?: string;
  region?: string;
}

export function createTaskDefinition(
  scope: Construct,
  id: string,
  options: TaskDefinitionProps,
): ecs.TaskDefinition {
  // Create an execution role for ECS tasks
  const executionRole = new iam.Role(scope, `${id}#EcsTaskExecutionRole`, {
    assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    managedPolicies: [
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AmazonECSTaskExecutionRolePolicy",
      ),
    ],
  });

  // Create a task role for ECS tasks
  const taskRole = new iam.Role(scope, `${id}#EcsTaskRole`, {
    assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
  });

  if (options.firehoseStream) {
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["firehose:PutRecord", "firehose:PutRecordBatch"],
        resources: [options.firehoseStream.attrArn],
      }),
    );
  }

  if (options.ddbTableName) {
    const ddbTable = aws_dynamodb.TableV2.fromTableName(
      scope,
      "watch-session-ddb-table",
      options.ddbTableName,
    );
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:ConditionCheckItem",
          "dynamodb:DeleteItem",
          "dynamodb:DescribeTable",
          "dynamodb:GetItem",
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:PutItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:UpdateItem",
        ],
        resources: [ddbTable.tableArn, `${ddbTable.tableArn}/index/*`],
      }),
    );
  }

  // Add PassRole permission to allow ECS to use the roles
  executionRole.addToPolicy(
    new iam.PolicyStatement({
      actions: ["iam:PassRole"],
      resources: [taskRole.roleArn, executionRole.roleArn],
    }),
  );

  const taskDefinition = new ecs.FargateTaskDefinition(scope, id, {
    cpu: 256,
    memoryLimitMiB: 512,
    executionRole: executionRole,
    taskRole: taskRole,
  });

  // Container
  const container = taskDefinition.addContainer("watch-session-container", {
    image: ecs.ContainerImage.fromRegistry(options.imagesRegistry),
    logging: new ecs.AwsLogDriver({
      streamPrefix: "watch-session-container",
    }),
  });

  container.addPortMappings({
    containerPort: options.port,
  });

  if (options.firehoseStream) {
    container.addEnvironment(
      "FIREHOSE_STREAM_NAME",
      `watch-session-kinesis-delivery-stream-${env.ENV}`,
    );
  }

  if (options.port) {
    container.addEnvironment("PORT", options.port.toString());
  }

  if (options.region) {
    container.addEnvironment("AWS_REGION", options.region);
  }

  return taskDefinition;
}
