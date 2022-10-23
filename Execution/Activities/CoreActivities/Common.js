const { default: axios } = require("axios");

const getters = {}
const setters = {}

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

getters.createNullExecutor = function createNullExecutor(value) {
    return async () => null;
}

exports.generateGetter = (origin, expression) => {
    switch (origin) {
        case '0': return getters.createStringExecutor(expression); break;
        case '1': return getters.createNumberExecutor(expression); break;
        case '2': return getters.createJsExecutor(expression); break;
        case '3': return getters.createTransformationExecutor(expression); break;
        case '4': return getters.createHttpExecutor(expression); break;
        case '5': return getters.createStorageExecutor(expression, "F"); break;
        case '6': return getters.createStorageExecutor(expression, "A"); break;
        case '7': return getters.createStorageExecutor(expression, "P"); break;
        case '8': return getters.createPayloadExecutor(expression); break;
        case '9': return getters.createMsgExecutor(expression); break;
        default: return getters.createNullExecutor(expression);
    }
}


setters.createPayloadSetter = function createPayloadSetter (item) {
    return async(msg, payload, activity, process, flow, value) => {
        payload[item] = value;
    }
}

setters.createMsgSetter = function createMsgSetter (item) {
    return async(msg, payload, activity, process, flow, value) => {
        msg[item] = value;
    }
}

setters.createStorageSetter = function createStorageSetter(item, type) {
    return async(msg, payload, activity, process, flow, value) => {
        switch (type) {
            case 'F': await flow?.data?.setValue(item, value); break;
            case 'A': await activity?.data?.getValue(item, value); break;
            case 'P': await process?.data?.getValue(item, value); break;
        }
    }
}

setters.createNullSetter = function createNullSetter() {
    return async() => { }
}

exports.generateSetter = (destination, expression) => {
    switch(destination) {
        case '0': return setters.createPayloadSetter(expression);
        case '1': return setters.createMsgSetter(expression)
        case '2': return setters.createStorageSetter(expression, "P");
        case '3': return setters.createStorageSetter(expression, "F");
        case '4': return setters.createStorageSetter(expression, "A");
        default: return setters.createNullSetter();
    }
}

exports.getters = getters;
exports.setters = setters;