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
        //console.info("inserting logs", data);
        await dynamo.put(params).promise();
    } catch (err) {
        console.log(err);
    }
    
}

class Logger {

    constructor(flowId, processId, executionId) {
        this.flowId = flowId;
        this.processId = processId;
        this.executionId = executionId;
        this.loglevel = 0;
        this.entries = [];
        this.startTime = new Date().toISOString();
    }

    setExecutionId(executionId) {
        this.executionId = executionId;
    }

    setLogLevel(logLevel) {
        this.loglevel = logLevel;
    }

    addToEntries(logObject) {
        this.entries.push(logObject);
    }

    buildSortKey() {
        return `${this.processId}/${this.executionId}`;
    }

    write(level, object, isUserLog) {
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
            type: messageType,
            isUserLog: !!isUserLog
        }

        this.addToEntries(logObject);
    }

    devideAndWrite(level, args, isUserLog) {
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            this.write(level, arg, isUserLog);
        }
    }

    note() {
        if (this.loglevel < 1) {
            console.debug.apply(null, arguments);
            this.devideAndWrite("NOTE", arguments, false);
        }
    }

    debug() {
        if (this.loglevel < 2) {
            console.debug.apply(null, arguments);
            this.devideAndWrite("DEBUG", arguments, false);
        }
    }

    trace() {
        if (this.loglevel < 3) {
            console.trace.apply(null, arguments);
            this.devideAndWrite("TRACE", arguments, false);
        }
    }

    log() {
        if (this.loglevel < 4) {
            console.log.apply(null, arguments);
            this.devideAndWrite("LOG", arguments, false);
        }
    }

    info() {
        if (this.loglevel < 5) {
            console.info.apply(null, arguments);
            this.devideAndWrite("INFO", arguments, false);
        }
    }

    warn() {
        if (this.loglevel < 6) {
            console.warn.apply(null, arguments);
            this.devideAndWrite("WARN", arguments, false);
        }
    }

    error() {
        if (this.loglevel < 7) {
            console.error.apply(null, arguments);
            this.devideAndWrite("ERROR", arguments, false);
        }
    }

    user_note() {
        if (this.loglevel < 1) {
            console.debug.apply(null, arguments);
            this.devideAndWrite("NOTE", arguments, true);
        }
    }

    user_debug() {
        if (this.loglevel < 2) {
            console.debug.apply(null, arguments);
            this.devideAndWrite("DEBUG", arguments, true);
        }
    }

    user_trace() {
        if (this.loglevel < 3) {
            console.trace.apply(null, arguments);
            this.devideAndWrite("TRACE", arguments, true);
        }
    }

    user_log() {
        if (this.loglevel < 4) {
            console.log.apply(null, arguments);
            this.devideAndWrite("LOG", arguments, true);
        }
    }

    user_info() {
        if (this.loglevel < 5) {
            console.info.apply(null, arguments);
            this.devideAndWrite("INFO", arguments, true);
        }
    }

    user_warn() {
        if (this.loglevel < 6) {
            console.warn.apply(null, arguments);
            this.devideAndWrite("WARN", arguments, true);
        }
    }

    user_error() {
        if (this.loglevel < 7) {
            console.error.apply(null, arguments);
            this.devideAndWrite("ERROR", arguments, true);
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

        //TODO: use and extention to make this off process
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