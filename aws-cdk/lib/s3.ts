import * as s3 from "aws-cdk-lib/aws-s3";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import env from "../config/env";

export function createS3Bucket(scope: Construct, id: string): s3.Bucket {
  const s3Bucket = new s3.Bucket(scope, id, {
    bucketName: `watch-session-${env.ENV}`,
    versioned: false,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    autoDeleteObjects: true,
    eventBridgeEnabled: true,
  });

  return s3Bucket;
}
