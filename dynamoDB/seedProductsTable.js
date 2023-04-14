import {DynamoDBClient, BatchWriteItemCommand} from "@aws-sdk/client-dynamodb";
import {marshall} from "@aws-sdk/util-dynamodb";
import {products} from "./data.js";

const putRequestItems = products.map(item => {
    const Item = marshall(item);

    return {
        PutRequest: {
            Item
        }
    }
});

const input = {
    "RequestItems": {
        "products": putRequestItems
    }
};

const client = new DynamoDBClient({region: "eu-west-1"});
const command = new BatchWriteItemCommand(input);

try {
    const res = await client.send(command);
    console.log('Seed success', res)
} catch (err) {
    console.error('Seed error ', err);
}
