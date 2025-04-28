import { logger } from "../utils/logger.util";
import AWS from "aws-sdk";
import { PutBucketLifecycleConfigurationRequest } from "aws-sdk/clients/s3";

export const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    endpoint: process.env.AWS_ENDPOINT,
    s3ForcePathStyle: true,
    signatureVersion: "v4",
    region: process.env.AWS_REGION,
});

// Test S3 connection
s3.listBuckets((err, data) => {
    if (err) {
        logger.error(
            `[S3]-[Connection] Failed to connect to S3: ${err.message}`
        );
    } else {
        logger.info(`[S3]-[Connection] Successfully connected to S3`);
        logger.info(
            `[S3]-[Connection] Available buckets: ${data.Buckets?.map(
                (b) => b.Name
            )}`
        );
    }
});

const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    LifecycleConfiguration: {
        Rules: [
            {
                ID: "delete-pending-files",
                Status: "Enabled",
                Filter: {
                    Tag: {
                        Key: "status",
                        Value: "pending",
                    },
                },
                Expiration: {
                    Days: 1,
                },
            },
        ],
    },
};

// Apply configuration
s3.putBucketLifecycleConfiguration(
    params as PutBucketLifecycleConfigurationRequest,
    (err, data) => {
        if (err)
            logger.error(
                `[S3]-[putBucketLifecycleConfiguration] Error setting lifecycle rule: ${err.message}`
            );
        else
            logger.info(
                `[S3]-[putBucketLifecycleConfiguration] Lifecycle rule set successfully`
            );
    }
);
