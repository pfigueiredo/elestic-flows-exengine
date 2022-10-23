const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient({region: "eu-west-1"});

const tableName = 'elastic-flow-executionStorage';

async function SaveObject(id, obj) {
    
    const key = { waitId: id };
    const data = obj;
    
    data.createdDate = data.createdDate ?? Date.now();
    data.modifiedDate = Date.now();

    const params = {
        Key: key,
        Item: data,
        TableName: tableName
    };

    return await dynamo.put(params).promise();
    
}

async function GetObjectById(id) {

    const key = { waitId: id };

    const params = {
        Key: key,
        TableName: tableName
    };

    return await dynamo.get(params).promise();

}

async function getValue(key) {
    const value = await GetObjectById(key);
    return value?.Item;
}

async function setValue(key, obj) {
    return await SaveObject(key, obj);
}

exports.getValue = getValue;
exports.setValue = setValue;