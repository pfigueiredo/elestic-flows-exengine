const AWS = require('aws-sdk');
const { resolve } = require('aws-sdk/lib/model/shape');
const dynamo = new AWS.DynamoDB.DocumentClient({region: "eu-west-1"});

const tableName = 'elastic-flow-storage';

async function SaveObject(id, obj) {
    
    const key = { itemId: id };
    const data = { itemId: id, value: obj }
    
    const params = {
        Key: key,
        Item: data,
        TableName: tableName
    };

    const promise = new Promise((resolve, reject) => {
        dynamo.put(params, function(err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    })
    
}

async function GetObjectById(id) {

    const key = { itemId: id };

    const params = {
        Key: key,
        TableName: tableName
    };

    const promise = new Promise(function(resolve, reject) {
        dynamo.get(params, function(err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data?.Item?.value);
            }
        });
    });
    return promise

}

async function getValue(key) {
    return await GetObjectById(key);
}

async function setValue(key, obj) {
    return await SaveObject(key, obj);
}

exports.getValue = getValue;
exports.setValue = setValue;