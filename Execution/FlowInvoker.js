const AWS = require("aws-sdk");

const function_name = 'elastic_flow_executor';

class FlowInvoker {

    constructor(engine) { 
        this.engine = engine;
    }

    async invokeLocalEndPoint(msg, entryPoint, processId) {
        const stepInfo = msg.next;

        const engine = this.engine.createNewInstance(true);

        const entry = {
            type: "e-flow",
            method: "ANY",
            entryPoint: entryPoint ?? "default"
        }
        const ep = await engine.prepareExecution(entry, processId, true);
        const ret = await engine.execute(msg, ep);

        return ret;
    }

    async invokeEndPoint(msg, entryPoint, processId, type) {
        const stepInfo = msg.next;

        const lambdaPayload = {
            msg: msg,
            flowId: stepInfo.flowId,
            address: stepInfo.address,
            type: "e-flow",
            processId: processId,
            restoreFromS3: false,
            entryPoint: entryPoint
        }

        let invocationType;

        switch (type) {
            case "call": 
                this.engine.logger.warn("remote sync invokation have a double cost and should be avoided");
                invocationType = 'RequestResponse'; 
                break;
            case "trigger": invocationType = "Event"; break;
        }

        var lambda = new AWS.Lambda({region: "eu-west-1"});

        var params = {
            FunctionName: function_name, /* required */
            //ClientContext: '',
            //Qualifier: ''
            InvocationType: invocationType,
            LogType: "Tail",
            Payload: JSON.stringify(lambdaPayload)
        };

        const promise = new Promise((resolve, reject) => {
            lambda.invoke(params, function(err, data) {
                if (err) reject(err); // an error occurred
                else resolve(JSON.parse(data.Payload)) // successful response
            });
        })

        return promise;
    }

    async invokeStep(msg, processId, type) {

        const stepInfo = msg.next;

        const lambdaPayload = {
            msg: msg,
            flowId: stepInfo.flowId,
            address: stepInfo.address,
            type: "e-flowStep",
            processId: processId,
            restoreFromS3: false
        }

        let invocationType

        switch (type) {
            case "call": 
                this.engine.logger.warn("remote sync invokation have a double cost and should be avoided");
                invocationType = 'RequestResponse'; 
                break;
            case "trigger": invocationType = "Event"; break;
        }

        var lambda = new AWS.Lambda({region: "eu-west-1"});

        var params = {
            FunctionName: function_name, /* required */
            //ClientContext: '',
            //Qualifier: ''
            InvocationType: invocationType,
            LogType: "None",
            Payload: JSON.stringify(lambdaPayload)
        };

        const promise = new Promise((resolve, reject) => {
            lambda.invoke(params, function(err, data) {
                if (err) reject(err); // an error occurred
                else resolve(data) // successful response
            });
        })

        return promise;

    }

}

exports.FlowInvoker = FlowInvoker;