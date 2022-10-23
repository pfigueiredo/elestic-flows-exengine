const crypto = require('crypto');
const { getValue, setValue } = require('./ExecutionStorageDb');

class ExecutionStorage {
    constructor() { }

    generateWaitId() {
        return crypto.randomUUID();
    }

    async storeExecutionData(processId, executionId, flowId, activity, isDebug, pending, msg) {
        const key = this.generateWaitId();
        const value = {
            waitId: key,
            processId: processId,
            executionId: executionId,
            flowId: flowId,
            activity: activity,
            isDebug: isDebug,
            data: JSON.stringify(msg),
            pending: !!pending,
        }

        return await setValue(key, value);
    }

    async getExecutionData(waitId) {
        return await getValue(waitId);
    }

    async continueExecution(waitId) {
        const data = await getValue(waitId);
        if (!!data && data.pending) {
            data.continuationDate = Date.now();
            data.pending = false;
            setValue(waitId, value);
        }
    }

}

exports.ExecutionStorage = ExecutionStorage;