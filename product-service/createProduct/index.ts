'use strict';
import { DynamoDBClient, TransactWriteItemsCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidV4 } from 'uuid';

const { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } = process.env;
const client = new DynamoDBClient({});

export const createProduct = async (event) => {
    try {
        console.log('event', event);
        const data = JSON.parse(event.body);
        const { title, description, price, count } = data;
        const id = uuidV4();
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
        await client.send(command);

        const response = {id, ...data};

        return {
            statusCode: 200,
            body: JSON.stringify(response, null, 2),
        };
    } catch (error) {
        console.log('createProduct error: ', error)
        return {
            statusCode: 500,
            body: JSON.stringify(error),
        };
    }
};
