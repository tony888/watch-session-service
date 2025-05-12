import { config as dotenvConfig } from 'dotenv';
import * as env from 'env-var';

dotenvConfig({ path: '.env' });

export const PORT = env.get('PORT').required().asIntPositive() || 3001;
export const AWS_REGION = env.get('AWS_REGION').required().asString() || 'ap-southeast-1';
export const FIREHOSE_STREAM_NAME = env.get('FIREHOSE_STREAM_NAME').required().asString()||'';
