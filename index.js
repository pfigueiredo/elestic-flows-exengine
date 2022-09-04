const { Engine } = require("./Execution/Engine");
const { Message } = require("./Execution/ExecutionModels/Message");

const executorVersion = 'v0.1.20220902.2'

console.log(`engine starting version ${executorVersion}`);

const engine = new Engine();

function Ok(obj) {
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

function Error(statusCode, obj) {
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

const handleHttpEvent = async (event, context) => {

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

    if (!!entryPoint) {

        const message = new Message({
            next: null, 
            payload: { 
                event: event, 
                context: context,
                body: JSON.parse(event?.body)
            }, 
        });

        const retMessage = await engine.execute(message);
        const returnObj = engine.getReturnObject();

        if (returnObj.code > 300) {
            console.log(returnObj);
            return Error(returnObj.code, returnObj.body);
        } else
            return Ok(returnObj.body);

    } else {
        return Error(404, { message: `flow not found: ${event?.httpMethod ?? "GET"} ${path}` })
    }
}

exports.handler = async (event, context) => {

    //console.log(event);    

    //TODO: write code to switch trigger type
    return await handleHttpEvent(event, context);
}

exports.handler_old = (event, context, callback) => {

    let eventVersion = event.version;
    let httpMethod = event.httpMethod;
    let resource = event.resource;
    let data = JSON.parse(event.body);
    let query = event.queryStringParameters;
    let isError = false;
    let errorMessage = "";
    let tableName = '';
    let keyName = '';
    let operation = null;

    console.log(`Processing event version ${eventVersion} method ${httpMethod}`);

    switch (resource) {
        case '/flows': 
            tableName = 'elastic-flows'; 
            keyName = 'flowId';
            break;
        default: 
            isError = true;
            tableName = '';
            errorMessage = `can't determine a resource name from the provided endpoint ${resource}`;
            break;
    }

    let dataObject = {};

    switch (httpMethod) {
        case 'GET': 
            operation = (!!query && !!query[keyName]) ? 'READ' : 'LIST';             
            break;
        case 'PATCH':
            operation = 'UPDATE';
            break;
        case 'POST': 
            operation = 'SAVE';
            data = CreateId(data, keyName); 
            break;
        case 'PUT': 
            operation = 'SAVE'; 
            data = CheckId(data, keyName);
            break;
        case 'DELETE': operation = 'DELETE'; break;
        case 'TRACE': operation = 'PING'; break;
        case 'OPTIONS': operation = 'ECHO'; break;
        default:
            isError = true;
            errorMessage = `cant determine operation from the provided method: ${httpMethod}`;
            break;

    }
    
    const operationKey = (!!data) ? data[keyName] : "empty";
    
    console.log(`running ${operation} on ${operationKey}`);

    switch (operation) {
        case 'SAVE':
            PutObject(data, keyName, tableName, callback);
            break;
        case 'READ':
            GetObjectById(query[keyName], keyName, tableName, callback);
            break;
        case 'UPDATE':
            UpdateObject(data, keyName, tableName, callback);
            break;
        case 'DELETE':
            DeleteObjectById(query[keyName], keyName, tableName, callback);
            break;
        case 'LIST':
            GetObjectList(tableName, callback);
            break;
        case 'ECHO':
            callback(null, "GET PATCH POST PUT DELETE TRACE OPTIONS");
            break;
        case 'PING':
            callback(null, "pong");
            break;
        default:
            callback(`Unknown operation: ${operation}`);
    }

};