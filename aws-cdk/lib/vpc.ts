import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

//use exsist vpc
export function getVpc(scope: Construct, id: string, vpcId: string): ec2.IVpc {
  return ec2.Vpc.fromLookup(scope, id, {
    vpcId: vpcId,
  });
}
