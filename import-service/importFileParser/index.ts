'use strict';
import csv from "csv-parser";
import {CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {SendMessageCommand, SQSClient} from "@aws-sdk/client-sqs";

const s3Client = new S3Client({});
const sqsClient = new SQSClient({});

export const importFileParser = async (event) => {
    try {
        console.log(process.env)
        console.log('event', event);
        const [record] = event.Records;
        console.log('record.s3', record.s3);
        const {bucket, object} = record.s3;
        const getCommand = new GetObjectCommand({
            Bucket: bucket.name,
            Key: object.key
        });
        const file = await s3Client.send(getCommand);
        await new Promise((resolve, reject) => {
            // @ts-ignore
            file.Body.pipe(csv())
                .on("data", async (data) => {
                    console.log('Data: ', data)
                    const sqsInput = {
                        QueueUrl: process.env.SQS_URL,
                        MessageBody: JSON.stringify(data)
                    };
                    const sqsCommand = new SendMessageCommand(sqsInput);
                    await sqsClient.send(sqsCommand);
                })
                .on("end", async () => {
                    console.log('Stream finish!');
                    const copyCommand = new CopyObjectCommand({
                        Bucket: bucket.name,
                        CopySource: bucket.name + '/' + object.key,
                        Key: object.key.replace('uploaded/', 'parsed/'),
                    });
                    await s3Client.send(copyCommand);
                    console.log('Copy to new folder finished!')

                    const deleteCommand = new DeleteObjectCommand({
                        Bucket: bucket.name,
                        Key: object.key,
                    });
                    await s3Client.send(deleteCommand);
                    console.log('Source file deleted!')
                })

        });
    } catch (error) {
        console.log('importFileParser error: ', error)
    }
};
