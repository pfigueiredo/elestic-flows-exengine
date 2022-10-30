const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient({region: "eu-west-1"});

const tableName = 'elastic-flow-storage';

async function SaveObject(id, obj, flowId, activityId, processId) {
    
    const key = { itemId: id };
    const data = { 
        itemId: id, 
        value: obj,
        flowId: flowId,
        activityId: activityId,
        processId: processId,
        timeStamp: Date.now()
    }
    
    const params = {
        Key: key,
        Item: data,
        TableName: tableName
    };

    return await dynamo.put(params).promise();
    
}

async function GetObjectById(id) {

    const key = { itemId: id };

    const params = {
        Key: key,
        TableName: tableName
    };

    return await dynamo.get(params).promise();

}

async function getValue(key) {
    const value = await GetObjectById(key);
    return value?.Item?.value;
}

async function setValue(key, obj, flowId, activityId, processId) {
    return await SaveObject(key, obj, flowId, activityId, processId);
}

exports.getValue = getValue;
exports.setValue = setValue;