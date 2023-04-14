'use strict';

export const basicAuthorizer = async (event) => {
    try {
        console.log('event', event);
        const {headers} = event;
        const {authorization} = headers;

        const [_, token] = authorization.split(' ');
        const encoded = Buffer.from(token, 'base64').toString('utf-8');
        const [tokenUsername, tokenPassword] = encoded.split('=');
        console.log('process.env', process.env)
        const username = process.env.USERNAME;
        const password = process.env.PASSWORD;
        console.log('username', username)
        const access = username && password && username === tokenUsername && password === tokenPassword;
        const effect = access ? 'Allow' : 'Deny';

        const policy = {
            principalId: token,
            policyDocument: {
                Version: '2012-10-17',
                Statement: {
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: event.routeArn
                }
            }

        }
        console.log('policy', policy);

        return policy;
    } catch (error) {
        console.log('importProductsFile error: ', error)
        return {
            statusCode: 500,
            body: JSON.stringify(error),
        };
    }
};
