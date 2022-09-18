const crypto = require('crypto');
const { Dictionary } = require("./Execution/Utils/Dictionary");
const AWS = require('aws-sdk')
const dynamo = new AWS.DynamoDB.DocumentClient({region: "eu-west-1"});

const loggers = new Dictionary();
const tableName = "elastic-flow-logs";

async function SaveObject(flowId, executionId, entries, startTime, endTime) {
    
    const key = { flowId: flowId, executionId: executionId };
    const data = { 
        flowId: flowId, 
        executionId: executionId, 
        items: entries,
        start: startTime,
        end: endTime
    };
    
    const params = {
        Key: key,
        Item: data,
        TableName: tableName
    };

    try {
        console.info("inserting logs", data);
        await dynamo.put(params).promise();
    } catch (err) {
        console.log(err);
    }

    // const promise = new Promise((resolve, reject) => {
    //     dynamo.put(params, function(err, data) {
    //         if (err) {
    //             reject(err);
    //         } else {
    //             resolve(data);
    //         }
    //     });
    // })
    
}

class Logger {

    constructor(flowId, processId, executionId) {
        this.flowId = flowId;
        this.processId = processId;
        this.executionId = executionId;
        this.entries = [];
        this.startTime = new Date().toISOString();
    }

    addToEntries(logObject) {
        this.entries.push(logObject);
    }

    buildSortKey() {
        return `${this.processId}/${this.executionId}`;
    }

    write(level, object) {
        const type = (typeof object);
        let message = null;
        let messageType = "v";
        if (type === "object") {
            message = JSON.stringify(object);
            messageType = "o";
        }
        else if (type === "function") {
            message = `[function] ${object.name}:${object.length}`;
        } else
            message = object;

        const logObject = {
            level: level,
            message: message,
            time: new Date().toISOString(),
            type: messageType
        }

        this.addToEntries(logObject);
    }

    trace() {
        console.trace.apply(null, arguments);
        for (let i = 0; i < arguments.length; i++) {
            const arg = arguments[i];
            this.write("TRACE", arg);
        }
    }

    log() {
        console.log.apply(null, arguments);
        for (let i = 0; i < arguments.length; i++) {
            const arg = arguments[i];
            this.write("LOG", arg);
        }
    }

    info() {
        console.info.apply(null, arguments);
        for (let i = 0; i < arguments.length; i++) {
            const arg = arguments[i];
            this.write("INFO", arg);
        }
    }

    warn() {
        console.warn.apply(null, arguments);
        for (let i = 0; i < arguments.length; i++) {
            const arg = arguments[i];
            this.write("WARN", arg);
        }
    }

    error() {
        console.error.apply(null, arguments);
        for (let i = 0; i < arguments.length; i++) {
            const arg = arguments[i];
            this.write("ERROR", arg);
        }
    }

    async flushLogs() {
        const sortKey = this.buildSortKey();
        const key = this.flowId;
        this.endTime = new Date().toISOString();

        const entriesToSave = [ ... this.entries ]; 
        this.entries = []; //clean up

        await SaveObject(key, sortKey, entriesToSave, this.startTime, this.endTime).catch((err) => {
            console.log(err);
        });

        console.log('FLUSHED LOGS')

        this.startTime = new Date().toISOString();
        this.executionId = crypto.randomUUID();
    }

}

const getLogger = function(flowId, processId, executionId) {

    console.log(`creating logger for flowId:${flowId} processId:${processId} executionId:${executionId}`)

    if (!loggers.containsKey(flowId))
        loggers.add(flowId, new Dictionary());

    const flowDict = loggers.get(flowId);
    if (!flowDict.containsKey(processId))
        flowDict.add(processId, new Dictionary());

    const processDict = flowDict.get(processId);
    if (!processDict.containsKey(executionId))
        processDict.add(executionId, true);
    else
        console.error(`logger for the current executionId alread exists: flowId:${flowId} processId:${processId} executionId:${executionId}`);

    return new Logger(flowId, processId, executionId);
}


exports.getLogger = getLogger;