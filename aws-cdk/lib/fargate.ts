import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import env from "../config/env";
import { Construct } from "constructs";

// Utility function to generate consistent hash for strings
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}

const isProd = env.ENV === "prod";

export function createFargateService(
  scope: Construct,
  id: string,
  name: string,
  cluster: ecs.Cluster,
  taskDefinition: ecs.TaskDefinition,
  httpsListener: elbv2.ApplicationListener,
  containerPort: number,
  privateSubnets: ec2.ISubnet[],
  prefixPath?: string,
): ecs.FargateService {
  const targetGroup = new elbv2.ApplicationTargetGroup(
    scope,
    `TargetGroup-${id}`,
    {
      vpc: cluster.vpc,
      port: containerPort,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: prefixPath ? `/${prefixPath}/health` : "/health",
        port: containerPort.toString(),
        healthyHttpCodes: "200",
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        unhealthyThresholdCount: 2,
        healthyThresholdCount: 2,
      },
    },
  );

  // Add path-based routing if pathPattern is provided
  if (prefixPath) {
    // Calculate a hash-based priority to avoid conflicts
    const priority = Math.abs(hashCode(prefixPath)) % 50000;

    httpsListener.addAction(`Action-${id}`, {
      priority: priority,
      conditions: [
        elbv2.ListenerCondition.pathPatterns([
          `/${prefixPath}`, // Exact match
          `/${prefixPath}/`, // Trailing slash
          `/${prefixPath}/*`, // Wildcard match
          ...(prefixPath === "api" ? [`/doc/*`] : []), // Serve static files for /doc
        ]),
      ],
      action: elbv2.ListenerAction.forward([targetGroup]),
    });
  } else {
    // Default routing (no path prefix)
    httpsListener.addTargetGroups(`TargetGroup-${id}`, {
      targetGroups: [targetGroup],
    });
  }

  const service = new ecs.FargateService(scope, `Service-${id}`, {
    cluster,
    taskDefinition,
    serviceName: name,
    desiredCount: isProd ? 3 : 1,
    assignPublicIp: false,
    vpcSubnets: {
      subnets: privateSubnets,
    },
    healthCheckGracePeriod: cdk.Duration.seconds(60),
  });

  const scaling = service.autoScaleTaskCount({ maxCapacity: isProd ? 100 : 2 });
  scaling.scaleOnCpuUtilization(`CpuScaling-${id}`, {
    targetUtilizationPercent: 60,
    scaleInCooldown: cdk.Duration.seconds(60),
    scaleOutCooldown: cdk.Duration.seconds(60),
  });

  service.attachToApplicationTargetGroup(targetGroup);

  return service;
}
