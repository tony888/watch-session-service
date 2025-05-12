import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { CONFIG } from "../config";
import { S3Event } from "../types";
import { createLogger } from "../utils/logger";

const s3Client = new S3Client({ region: CONFIG.region });
const logger = createLogger({ service: "s3-service" });

export const readData = async (event: S3Event): Promise<string> => {
  const {
    detail: { bucket, object },
  } = event;

  try {
    const command = new GetObjectCommand({
      Bucket: bucket.name,
      Key: object.key,
    });

    const output = await s3Client.send(command);
    const data = await output.Body?.transformToString("utf-8");

    if (!data) {
      throw new Error("Empty response from S3");
    }

    return data;
  } catch (error) {
    logger.error("Failed to read from S3", {
      bucket: bucket.name,
      key: object.key,
      error,
    });
    throw error;
  }
};
