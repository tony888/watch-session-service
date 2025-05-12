import "dotenv/config";
import { get } from "env-var";
import { version } from "../../apps/watch-session-api/package.json";

const ENV_NAMES = {
  production: "prod",
  staging: "staging",
  test: "test",
  development: "dev",
  pent: "pent",
} as const;

const envName = get("NODE_ENV").asString() as keyof typeof ENV_NAMES;

const env = {
  NODE_ENV: get("NODE_ENV").asString(),
  OWNER: get("OWNER").required().asString(),
  PROJECT: get("PROJECT").required().asString(),
  SUB_PROJECT: get("SUB_PROJECT").required().asString(),
  ENV: ENV_NAMES[envName] || process.env.NODE_ENV || "dev",
  APP_VERSION: version,
  CDK_DEFAULT_ACCOUNT: get("CDK_DEFAULT_ACCOUNT").required().asString(),
  CDK_DEFAULT_REGION: get("CDK_DEFAULT_REGION").required().asString(),
  VPC_ID: get("VPC_ID").required().asString(),
  CERTIFICATE_ARN: get("CERTIFICATE_ARN").required().asString(),
  SUBNET_NAME_PUBLIC_1B: get("SUBNET_NAME_PUBLIC_1B").required().asString(), //public-ap-southeast-1b 
  SUBNET_ID_PUBLIC_1B: get("SUBNET_ID_PUBLIC_1B").required().asString(),//subnet-0edec9c1d31f03511
  SUBNET_AZ_PUBLIC_1B: get("SUBNET_AZ_PUBLIC_1B").required().asString(),//ap-southeast-1b
  SUBNET_NAME_PUBLIC_1C: get("SUBNET_NAME_PUBLIC_1C").required().asString(),  
  SUBNET_ID_PUBLIC_1C: get("SUBNET_ID_PUBLIC_1C").required().asString(),
  SUBNET_AZ_PUBLIC_1C: get("SUBNET_AZ_PUBLIC_1C").required().asString(),
  SUBNET_NAME_PRIVATE_1B: get("SUBNET_NAME_PRIVATE_1B").required().asString(),  
  SUBNET_ID_PRIVATE_1B: get("SUBNET_ID_PRIVATE_1B").required().asString(),
  SUBNET_AZ_PRIVATE_1B: get("SUBNET_AZ_PRIVATE_1B").required().asString(),
  SUBNET_NAME_PRIVATE_1C: get("SUBNET_NAME_PRIVATE_1C").required().asString(),  
  SUBNET_ID_PRIVATE_1C: get("SUBNET_ID_PRIVATE_1C").required().asString(),
  SUBNET_AZ_PRIVATE_1C: get("SUBNET_AZ_PRIVATE_1C").required().asString(),
};
export default env;

