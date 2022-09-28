const { getters } = require('./Common');

const node = {};
node.type = 'core:log';

node.prepare = (properties, context) => {
    const preparation = {}
    preparation.level = properties.level ?? 0;
    preparation.origin = properties.origin ?? 0;
    preparation.expression = properties.expression ?? "";
    context.prepareFxApi();

    let getter = null;

    switch (preparation.origin) {
        case '0': getter = getters.createStringExecutor(preparation.expression); break;
        case '1': getter = getters.createNumberExecutor(preparation.expression); break;
        case '2': getter = getters.createJsExecutor(preparation.expression); break;
        case '3': getter = getters.createTransformationExecutor(preparation.expression); break;
        case '4': getter = getters.createHttpExecutor(preparation.expression); break;
        case '5': getter = getters.createStorageExecutor(preparation.expression, "F"); break;
        case '6': getter = getters.createStorageExecutor(preparation.expression, "A"); break;
        case '7': getter = getters.createStorageExecutor(preparation.expression, "P"); break;
        case '8': getter = getters.createPayloadExecutor(preparation.expression); break;
        case '9': getter = getters.createMsgExecutor(preparation.expression); break;
    }
    preparation.getter = getter;
    return preparation;
}

node.execute = async (context, msg) => {
    const preparation = context.preparation;
    const process = context.process;
    const activity = context.activity;
    const flow = context.flow;

    const logValue = await preparation.getter.call({}, msg, msg.payload, activity, process, flow);
    switch (preparation.level) {
        case '0': context.console.note(logValue); break;
        case '1': context.console.debug(logValue); break;
        case '2': context.console.log(logValue); break;
        case '3': context.console.info(logValue); break;
        case '4': context.console.warn(logValue); break;
        case '5': context.console.error(logValue); break;
        default: context.console.note(logValue); break;
    }

    context.continueWith(msg);
}

exports.logNode = node;