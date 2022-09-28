const { default: axios } = require("axios");

const getters = {}

const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

getters.createHttpExecutor = function createHttpExecutor(url) {
    return async () => { 
        const response = await axios.get(url); 
        return response.data;
    }
}

getters.createJsExecutor = function createJsExecutor(code) {
    const fxCode = `return ${code}`;
    const fx = new AsyncFunction("msg", "payload", "activity", "process", "flow", fxCode);
    return fx;
}

getters.createNumberExecutor = function createNumberExecutor(value) {
    return async () => {
        if (!isNaN(value))
            return parseFloat(value);
        else 
            return null;
    }
}

getters.createStringExecutor = function createStringExecutor(value) {
    return async () => { 
        return value?.toString(); 
    }
}

getters.createStorageExecutor = function createStorageExecutor(value, type) {
    return async(msg, payload, activity, process, flow) => {
        switch (type) {
            case 'F': return await flow?.data?.getValue(value);
            case 'A': return await activity?.data?.getValue(value);
            case 'P': return await process?.data?.getValue(value);
            default: return null;
        }
    }
}

getters.createPayloadExecutor = function createPayloadExecutor(value) {
    return async(msg, payload, activity, process, flow) => {
        return (!!payload) ? (payload[value] ?? null) : null;
    }
}

getters.createMsgExecutor = function createMsgExecutor(value) {
    return async(msg, payload, activity, process, flow) => {
        return (!!msg) ? (msg[value] ?? null) : null;
    }
}

getters.createTransformationExecutor = function createTransformationExecutor(value) {
    return async () => null;
}

exports.getters = getters;