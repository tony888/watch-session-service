import * as cdk from "aws-cdk-lib";
import { aws_ecs } from "aws-cdk-lib";
import * as certificatemanager from "aws-cdk-lib/aws-certificatemanager";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr from "aws-cdk-lib/aws-ecr";
import { DockerImageAsset } from "aws-cdk-lib/aws-ecr-assets";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as ecrdeploy from "cdk-ecr-deployment";
import { Construct } from "constructs";
import env from "../config/env";
import { createALB } from "./alb";
import { createFargateService } from "./fargate";
import { createFirehose } from "./firehose";
import { createS3Bucket } from "./s3";
import { configureSecurityGroup } from "./security-group";
import { getSubnet } from "./subnet";
import { createTaskDefinition } from "./task-define";

type Props = {
  httpsListener: elbv2.ApplicationListener;
  subnets: {
    privateSubnets: ec2.ISubnet[];
    publicSubnets: ec2.ISubnet[];
  };
};

export class ApiGatewayStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = ec2.Vpc.fromLookup(this, `vpc-superapp-${env.ENV}`, {
      vpcId: env.VPC_ID,
    });

    // ECS Cluster
    const cluster = new aws_ecs.Cluster(this, "watch-session-cluster", {
      vpc: vpc,
    });

    // Check for existing DynamoDB VPC endpoint
    const existingEndpoints = vpc
      .selectSubnets()
      .subnets.flatMap((subnet) => subnet.routeTable.routeTableId);

    if (existingEndpoints.length === 0) {
      // Add VPC endpoint for DynamoDB if it doesn't exist
      vpc.addGatewayEndpoint("DynamoDbEndpoint", {
        service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      });
    }

    // subnet for fargate
    // public subnet zone 1b
    const publicSubnet1b = getSubnet(
      this,
      env.SUBNET_NAME_PUBLIC_1B,
      env.SUBNET_ID_PUBLIC_1B,
      env.SUBNET_AZ_PUBLIC_1B,
    );

    // private subnet zone 1b
    const privateSubnet1b = getSubnet(
      this,
      env.SUBNET_NAME_PRIVATE_1B,
      env.SUBNET_ID_PRIVATE_1B,
      env.SUBNET_AZ_PRIVATE_1B,
    );

    // public subnet zone 1c
    const publicSubnet1c = getSubnet(
      this,
      env.SUBNET_NAME_PUBLIC_1C,
      env.SUBNET_ID_PUBLIC_1C,
      env.SUBNET_AZ_PUBLIC_1C,
    );

    // private subnet zone 1c
    const privateSubnet1c = getSubnet(
      this,
      env.SUBNET_NAME_PRIVATE_1C,
      env.SUBNET_ID_PRIVATE_1C,
      env.SUBNET_AZ_PRIVATE_1C,
    );

    // certificate ARN
    const certificateArn = env.CERTIFICATE_ARN;

    const publicSubnets = [publicSubnet1b, publicSubnet1c];
    const sharedAlb = createALB(
      this,
      "watch-session-shared-alb",
      vpc,
      publicSubnets,
    );

    new cdk.CfnOutput(this, "LoadBalancerDNS", {
      value: sharedAlb.loadBalancerDnsName,
    });

    new cdk.CfnOutput(this, "LoadBalancerURL", {
      value: `https://${sharedAlb.loadBalancerDnsName}`,
    });

    // ALB Listener
    let httpsListener = new elbv2.ApplicationListener(this, `httpsListener`, {
      loadBalancer: sharedAlb,
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [
        certificatemanager.Certificate.fromCertificateArn(
          this,
          `Certificate-${env.ENV}`,
          certificateArn,
        ),
      ],
      defaultAction: elbv2.ListenerAction.fixedResponse(403), // Default deny
    });

    const subnets = {
      privateSubnets: [privateSubnet1b, privateSubnet1c],
      publicSubnets: [],
    };

    this.createApiGateway(cluster, { httpsListener, subnets });
    this.createAppApi(cluster, { httpsListener, subnets });
  }

  createApiGateway(cluster: aws_ecs.Cluster, options: Props) {
    const serviceName = "watch-session-apigw";
    const containerPort = 3001;
    const repositoryName = `${serviceName}-${env.ENV}`;

    //S3
    const s3Bucket = createS3Bucket(this, `watch-session-s3-bucket-${env.ENV}`);

    // Firehose
    const firehose = createFirehose(this, s3Bucket);

    const repository = this.createEcrRepository(repositoryName);
    const imageAsset = new cdk.aws_ecr_assets.DockerImageAsset(
      this,
      `${serviceName}-image`,
      {
        directory: `${__dirname}/../../apps/gateway`,
        platform: cdk.aws_ecr_assets.Platform.LINUX_AMD64,
      },
    );

    const imageName = this.createEcrDeployment(
      serviceName,
      repository,
      imageAsset,
    );

    const taskDefinition = createTaskDefinition(this, `${serviceName}-task`, {
      port: containerPort,
      imagesRegistry: imageName,
      firehoseStream: firehose,
      region: "ap-southeast-1",
    });

    //Fargate
    const fargateService = createFargateService(
      this,
      `${serviceName}-fargate-service`,
      serviceName,
      cluster,
      taskDefinition,
      options.httpsListener,
      containerPort,
      options.subnets.privateSubnets,
    );

    //configure security group
    configureSecurityGroup(fargateService, containerPort);
  }

  createAppApi(cluster: aws_ecs.Cluster, options: Props) {
    const serviceName = "watch-session-api";
    const containerPort = 3000;
    const repositoryName = `${serviceName}-${env.ENV}`;

    const repository = this.createEcrRepository(repositoryName);
    const imageAsset = new cdk.aws_ecr_assets.DockerImageAsset(
      this,
      `${serviceName}-image`,
      {
        directory: `${__dirname}/../../apps/watch-session-api`,
        platform: cdk.aws_ecr_assets.Platform.LINUX_AMD64,
        buildArgs: {
          APP_ENV: env.ENV,
        },
      },
    );

    const imageName = this.createEcrDeployment(
      serviceName,
      repository,
      imageAsset,
    );

    const taskDefinition = createTaskDefinition(
      this,
      "watch-session-api-task",
      {
        port: containerPort,
        imagesRegistry: imageName,
        ddbTableName: `watch-session-${env.ENV}`,
        region: "ap-southeast-1",
      },
    );

    //Fargate
    const fargateService = createFargateService(
      this,
      "watch-session-api-fargate-service",
      serviceName,
      cluster,
      taskDefinition,
      options.httpsListener,
      containerPort,
      options.subnets.privateSubnets,
      "api",
    );

    //configure security group
    configureSecurityGroup(fargateService, containerPort);
  }

  createEcrDeployment(
    serviceName: string,
    repository: ecr.IRepository,
    imageAsset: DockerImageAsset,
  ) {
    const isProd = env.ENV === "prod";
    const imageTag = isProd ? env.APP_VERSION : imageAsset.imageTag;
    const destinationImage = `${repository.repositoryUri}:${imageTag}`;
    new ecrdeploy.ECRDeployment(
      this,
      `EcrDeployment-${serviceName}-${env.ENV}`,
      {
        src: new ecrdeploy.DockerImageName(imageAsset.imageUri),
        dest: new ecrdeploy.DockerImageName(destinationImage),
      },
    );
    return destinationImage;
  }

  createEcrRepository(repositoryName: string) {
    let ecrRepository: ecr.IRepository;
    try {
      ecrRepository = ecr.Repository.fromRepositoryName(
        this,
        `${repositoryName}-repository`,
        repositoryName,
      );
    } catch (error) {
      ecrRepository = new cdk.aws_ecr.Repository(
        this,
        `${repositoryName}-repository`,
        {
          repositoryName: repositoryName,
          lifecycleRules: [
            {
              description:
                "Keeps a maximum number of images to minimize storage",
              maxImageCount: 10,
            },
          ],
          ...(env.ENV !== "prod" && {
            emptyOnDelete: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
          }),
        },
      );
    }
    return ecrRepository;
  }
}
