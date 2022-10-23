const { default: axios } = require("axios");
const { generateGetter, generateSetter } = require('./Common');

const node = {};
node.type = 'http:call';

async function httpGet(url, config) {
    return await axios.get(url, config);
}

async function httpPost(url, data, config) {
    return await axios.post(url, data, config);
}

async function httpPut(url, data, config) {
    return await axios.put(url, data, config);
}

async function httpDelete(url, config) {
    return await axios.delete(url, config);
}

async function httpPatch(url, data, config) {
    return await axios.patch(url, data, config);
}

node.prepare = (properties) => {
    const preparation = { };

    preparation.method = properties.method ?? "get";

    preparation.configOrigin = properties.configOrigin ?? "";
    preparation.configExpression = properties.configExpression ?? "";

    preparation.urlOrigin = properties.urlOrigin ?? "";
    preparation.urlExpression = properties.urlExpression ?? "";

    preparation.dataOrigin = properties.dataOrigin ?? "";
    preparation.dataExpression = properties.dataExpression ?? "";

    preparation.responseVarDest = properties.elementVarDest ?? "0";
    preparation.responseVar = properties.elementVar ?? "response";
    
    preparation.configGetter = generateGetter(preparation.configOrigin, preparation.configExpression);
    preparation.urlGetter = generateGetter(preparation.urlOrigin, preparation.urlExpression);
    preparation.dataGetter = generateGetter(preparation.dataOrigin, preparation.dataExpression);
    preparation.responseSetter = generateSetter(preparation.responseVarDest, preparation.responseVar);

    return preparation;
}

node.execute = async (context, msg) => {
    const preparation = context.preparation;
    const method = preparation.method;
    const process = context.process;
    const activity = context.activity;
    const flow = context.flow;
    const needData = (method !== "get" && method !== "delete");

    const config =  await preparation.configGetter.call({}, msg, msg.payload, activity, process, flow);
    const url = await preparation.urlGetter.call({}, msg, msg.payload, activity, process, flow);
    let data = null;

    if (needData) 
        data = await preparation.dataGetter.call({}, msg, msg.payload, activity, process, flow);

    let value = null;

    if (url) {
        switch (method) {
            case 'get': value = await httpGet(url, config); break
            case 'post': value = await httpPost(url, data, config); break
            case 'put': value = await httpPut(url, data, config); break
            case 'delete': value = await httpDelete(url, config); break
            case 'patch': value = await httpPatch(url, data, config); break
            default:
                context.logger.error(`unknown method: ${method}`);
                break;
        }

        await preparation.responseSetter.call({}, msg, msg.payload, activity, process, flow);
    } else
        context.logger.error("can't do http call 'url' is null or empty")

    context.continueWith(msg);
}

exports.httpcall = node;