'use strict';
import {DynamoDBClient, TransactWriteItemsCommand} from "@aws-sdk/client-dynamodb";
import {PublishCommand, SNSClient} from "@aws-sdk/client-sns";

const {PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME, SNS_ARN} = process.env;
const dbClient = new DynamoDBClient({});
const snsClient = new SNSClient({});

export const catalogBatchProcess = async (event) => {
    try {
        console.log('event', event);
        const {Records} = event;
        const dataToRes = [];
        for await (const record of Records) {
            console.log('record', record);
            const {id, title, description, price, count} = JSON.parse(record.body);
            console.log('data', {id, title, description, price, count})
            const input = {
                TransactItems: [
                    {
                        Put: {
                            Item: {
                                id: {
                                    S: id
                                },
                                title: {
                                    S: title
                                },
                                description: {
                                    S: description
                                },
                                price: {
                                    N: `${price}`
                                }
                            },
                            TableName: PRODUCTS_TABLE_NAME,
                        },

                    },
                    {
                        Put: {
                            Item: {
                                product_id: {
                                    S: id
                                },
                                count: {
                                    N: `${count}`
                                }
                            },
                            TableName: STOCKS_TABLE_NAME,
                        },
                    }
                ]
            };

            const command = new TransactWriteItemsCommand(input);
            await dbClient.send(command);
            dataToRes.push(record.body);
        }

        const snsCommand = new PublishCommand({
            Subject: 'Product creation',
            Message: 'Products is created! ' + JSON.stringify(dataToRes),
            TopicArn: SNS_ARN
        });
        await snsClient.send(snsCommand);

    } catch (error) {
        console.log('catalogBatchProcess error: ', error)
        return {
            statusCode: 500,
            body: JSON.stringify(error),
        };
    }
};
