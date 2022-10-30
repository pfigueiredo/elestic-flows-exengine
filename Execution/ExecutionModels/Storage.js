const { IoTThingsGraph } = require('aws-sdk');
const { getValue, setValue } = require('./StorageDb');

class Storage {
    constructor(name, typeKey, flowId, activityId, processId) {
        this.name = name;
        this.flowId = flowId;
        this.activityId = activityId;
        this.processId = processId;
        this.typeKey = typeKey;
    }

    composeKey(key, typeKey) {
        return `${typeKey}#${key}`;
    }

    async setValue(key, value) { 
        const cKey = this.composeKey(key, this.typeKey);
        return await setValue(cKey, value, this.flowId, this.activityId, this.processId)
    }

    async getValue(key) { 
        const cKey = this.composeKey(key, this.typeKey);
        return await getValue(cKey)
    }

}

exports.Storage = Storage;