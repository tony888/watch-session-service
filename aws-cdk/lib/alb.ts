import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Construct } from "constructs";
import env from "../config/env";
import exp = require("constants");

//create ALB
export function createALB(
  scope: Construct,
  id: string,
  vpc: any,
  arrPublicSubnet: ec2.ISubnet[],
): elbv2.ApplicationLoadBalancer {
  return new elbv2.ApplicationLoadBalancer(scope, id, {
    loadBalancerName: `watch-session-alb-${env.ENV}`,
    vpc,
    internetFacing: false,
    vpcSubnets: {
      subnets: arrPublicSubnet,
    },
  });
}
