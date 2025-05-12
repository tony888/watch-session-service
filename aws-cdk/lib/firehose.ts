import * as iam from "aws-cdk-lib/aws-iam";
import * as firehose from "aws-cdk-lib/aws-kinesisfirehose";
import { Bucket } from "aws-cdk-lib/aws-s3";
import env from "../config/env";
import { Construct } from "constructs";

// Kinesis Firehose Delivery Stream
export function createFirehose(
  scope: Construct,
  s3: Bucket,
): firehose.CfnDeliveryStream {
  const firehoseRole = new iam.Role(scope, "FirehoseRole", {
    assumedBy: new iam.ServicePrincipal("firehose.amazonaws.com"),
  });

  const deliveryStream = new firehose.CfnDeliveryStream(
    scope,
    "FirehoseDeliveryStream",
    {
      deliveryStreamName: `watch-session-kinesis-delivery-stream-${env.ENV}`,
      deliveryStreamType: "DirectPut",
      s3DestinationConfiguration: {
        bucketArn: s3.bucketArn,
        roleArn: firehoseRole.roleArn,
      },
    },
  );

  // grant write permission to the firehose role
  s3.grantWrite(firehoseRole);

  return deliveryStream;
}
