'use strict';
import {BatchGetItemCommand, DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {unmarshall} from "@aws-sdk/util-dynamodb";

const {PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME} = process.env;
const client = new DynamoDBClient({});
const getInput = (id) => ({
    RequestItems: {
        [PRODUCTS_TABLE_NAME]: {
            Keys: [
                {
                    id: {S: id}
                }
            ]
        },
        [STOCKS_TABLE_NAME]: {
            Keys: [
                {
                    product_id: {S: id}
                }
            ]
        }
    }
});

export const getProductsById = async (event) => {
    try {
        console.log('event', event);
        const {id} = event.pathParameters;
        const command = new BatchGetItemCommand(getInput(id));
        const response = await client.send(command);
        const [productRaw] = response.Responses[PRODUCTS_TABLE_NAME];
        const product = unmarshall(productRaw);
        const [stockRaw] = response.Responses[STOCKS_TABLE_NAME];
        const {count} = unmarshall(stockRaw);

        const data = {...product, count};

        if (!data) {
            return {
                statusCode: 404,
                body: "Product not found",
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify(data, null, 2),
        };
    } catch (error) {
        console.log('getProductsById error: ', error)
        return {
            statusCode: 500,
            body: "Product not found",
        };
    }
};
