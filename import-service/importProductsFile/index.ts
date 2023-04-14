'use strict';
import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";

export const importProductsFile = async (event) => {
    try {
        console.log('event', event);
        const client = new S3Client({});
        const name = event?.queryStringParameters?.name;

        if (!name) {
            return {
                statusCode: 500,
                body: 'Please provide filename in path: /import/?name=fileName',
            };
        }
        console.log('env', process.env)
        const command = new PutObjectCommand({
            Bucket: process.env.BUCKET,
            Key: `uploaded/${name}`,
        });
        const url = await getSignedUrl(client, command, {expiresIn: 60});

        return {
            statusCode: 200,
            body: url,
        };
    } catch (error) {
        console.log('importProductsFile error: ', error)
        return {
            statusCode: 500,
            body: JSON.stringify(error),
        };
    }
};
