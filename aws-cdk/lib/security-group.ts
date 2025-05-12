import * as ec2 from "aws-cdk-lib/aws-ec2";
import { FargateService } from "aws-cdk-lib/aws-ecs";

export function configureSecurityGroup(
  fargateService: FargateService,
  containerPort: number,
) {
  const serviceSecurityGroup = fargateService.connections.securityGroups[0];
  const loadBalancerSecurityGroup =
    fargateService.connections.securityGroups[0];

  serviceSecurityGroup.addIngressRule(
    loadBalancerSecurityGroup,
    ec2.Port.tcp(containerPort),
    "Allow traffic from ALB to ECS tasks",
  );
}
