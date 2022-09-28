const { Engine } = require("./Execution/Engine");
const { StepInfo } = require("./Execution/ExecutionModels/Message");
const { Message } = require("./Execution/ExecutionModels/Message");

const executorVersion = 'v0.6.20220918.4'

console.log(`engine starting version ${executorVersion}`);

function EFlowOk(flowId, obj) {
    return {
        ok: true,
        payload: obj,
        flowId: flowId
    }
}

function EFlowError(obj) {
    return {
        ok: false,
        payload: obj,
        flowId: flowId
    }
}


function HttpOk(obj) {
    return {
        isBase64Encoded: false,
        statusCode: 200,
        headers: { 
            "Access-Control-Allow-Origin": '*',
            "Access-Control-Allow-Credentials": true,
            "content-type": "application/json"
        },
        body: JSON.stringify(obj)
    }
}

function HttpError(statusCode, obj) {
    return {
        isBase64Encoded: false,
        statusCode: statusCode,
        headers: { 
            "Access-Control-Allow-Origin": '*',
            "Access-Control-Allow-Credentials": true,
            "content-type": "application/json"
        },
        body: JSON.stringify(obj)
    }
}

const doInvocation = async (entryPoint, message, engine) => {
    if (!!entryPoint || !!message?.next) {
        const retMessage = await engine.execute(message, entryPoint);
        return engine.getReturnObject() ?? retMessage;
    } else
        return null;
}

const handleHttpEvent = async (event, context, engine) => {

    const stage = '/' + (event?.requestContext?.stage ?? 'default');
    let path = event?.path ?? '/'

    if (path.startsWith(stage))
        path = path.slice(stage.length);

    const entryPoint = await engine.prepareExecution({
        type: "http",
        method: event?.httpMethod ?? "GET",
        entryPoint: path ?? "#dummy",
        pathParameters: event?.pathParameters,
        queryStringParameters: event.queryStringParameters,
        headers: event?.headers,
        context: event?.requestContext
    });

    if (!entryPoint)
        return HttpError(404, { message: `flow not found: ${event?.httpMethod ?? "GET"} ${path}` })

    const payload = (!!event?.body) ?
        JSON.parse(event?.body) : { }

    const message = new Message({
        next: null, 
        event: event, 
        context: context,
        payload: payload
    });

    const returnObj = await doInvocation(entryPoint, message, engine);

    engine.logger.log('invocation ended');
    //engine.logger.log(returnObj);

    if (!!returnObj) {
        if (returnObj.code > 300) {
            engine.logger.log(returnObj);
            return HttpError(returnObj.code, returnObj.body);
        } else
            return HttpOk(returnObj.body);

    } else {
        return HttpError(200, { message: 'flow returned nothing' })
    }
};

const handleEFlowEvent = async function(event, context, engine) {
    
    const entryPoint = await engine.prepareExecution({
        type: "e-flow",
        method: "ANY",
        entryPoint: event.entryPoint ?? "default"
    }, event.processId );

    engine.logger.log('handle e-flow event');

    if (!entryPoint)
        return EFlowError(entryPoint.flowId, { message: `flow not found: ${event.start ?? "default"}` })

    const message = new Message({
        ...event.msg, next: null 
    });

    const returnObj = await doInvocation(entryPoint, message, engine);

    engine.logger.log('invocation ended');
    //engine.logger.log(returnObj);

    if (!!returnObj) {
        if (returnObj.code > 300) {
            engine.logger.log(returnObj);
            return EFlowError(entryPoint.flowId, returnObj.body);
        } else
            return EFlowOk(entryPoint.flowId, returnObj.body);

    } else {
        return EFlowError(entryPoint.flowId, { message: 'flow returned nothing' })
    }
};

const handleEFlowStep = async function(event, context, engine) {
    
    await engine.prepareFlow(event.flowId, event.processId);

    engine.logger.log('handle e-flow step');

    const next = new StepInfo({
        flowId: event.flowId,
        address: event.address
    });

    const message = new Message({
        ... event.msg, next: next
    });

    const returnObj = await doInvocation(null, message, engine);

    engine.logger.log('invocation ended');
    //engine.logger.log(returnObj);

    if (!!returnObj) {
        if (returnObj.code > 300) {
            engine.logger.log(returnObj);
            return EFlowError(event.flowId, returnObj.body);
        } else
            return EFlowOk(event.flowId, returnObj.body);

    } else {
        return EFlowError(event.flowId, { message: `flow not found: ${event.start ?? "default"}` })
    }
};

exports.handler = async (event, context) => {

    const engine = new Engine();
    let returnObject = {};

    try {
    
        engine.startEvent();
        console.log(event);

        if (!!event?.httpMethod)
            returnObject = await handleHttpEvent(event, context, engine);
        
        else if (event.type === "e-flow")
            returnObject = await handleEFlowEvent(event, context, engine);

        else if (event.type === "e-flowStep") 
            returnObject = await handleEFlowStep(event, context, engine);

        
    } catch (err) {
        return { Error: err }
    } finally {
        engine.endEvent(); //do the last logs
        await engine.flushLogs();
    }

    return returnObject;
};
