const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient({region: "eu-west-1"});

const tableName = 'elastic-flows';

async function GetEntryPoints(tableName) {
    const params = {
        TableName: tableName,
        AttributesToGet: ["flowId", "entryPoints"]
        //ProjectionExpression:"flowId, entryPoints",
    };

    const promise = new Promise(function (resolve, reject) {
        dynamo.scan(params, function(err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });

    return promise;
}

async function GetObjectById(id, keyName, tableName, callback) {

    let key = {};
    key[keyName] = id;

    const params = {
        Key: key,
        TableName: tableName
    };

    const promise = new Promise(function(resolve, reject) {
        dynamo.get(params, function(err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
    return promise

}

exports.getEntryPoints = async () => {
    const data = await GetEntryPoints(tableName);
    return data?.Items;
}

exports.getFlow = async function GetFlow(flowId) {
    const data = await GetObjectById(flowId, "flowId", tableName);
    return data?.Item;
}
