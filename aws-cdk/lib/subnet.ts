import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from "constructs";

//use exsist ec2.ISubnet
export function getSubnet(scope: Construct, id: string, subnetId: string,az:string): ec2.ISubnet {
	return ec2.Subnet.fromSubnetAttributes(scope, id, {
		subnetId: subnetId, 
		availabilityZone: az
	})
}
