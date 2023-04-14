'use strict';
import {DynamoDBClient, QueryCommand, ScanCommand} from "@aws-sdk/client-dynamodb";
import {unmarshall} from "@aws-sdk/util-dynamodb";

const {PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME} = process.env;
const client = new DynamoDBClient({});
const scanInput = {
    TableName: PRODUCTS_TABLE_NAME
};
const command = new ScanCommand(scanInput);

const stocksInput = {
    TableName: STOCKS_TABLE_NAME,
    KeyConditionExpression: "product_id = :productId",
    ExpressionAttributeValues: {
        ":productId": {S: ""},
    },
};

export const getProductsList = async () => {
    try {
        const productsRes = await client.send(command);
        const products = productsRes.Items.map(item => unmarshall(item));
        console.log('products', products);
        const promises = [];
        for await (const product of products) {
            stocksInput.ExpressionAttributeValues[":productId"].S = product.id;
            const stocksRes = await client.send(new QueryCommand(stocksInput));
            const {count} = unmarshall(stocksRes.Items[0]);
            product.count = count;
            console.log('product with count', product);
            promises.push(product)
        }

        const data = await Promise.all(promises);

        return {
            statusCode: 200,
            body: JSON.stringify(data, null, 2),
        };
    } catch (error) {
        console.log('getProductsList error: ', error);
        return {
            statusCode: 500,
            body: "Have no products"
        };
    }
}
