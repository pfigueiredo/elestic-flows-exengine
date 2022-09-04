const { default: axios } = require("axios");
const node = {};
node.type = 'core:function';

function buildExecutionFunction(properties) {
    if (!!properties?.functionCode) {
        const code = properties.functionCode;
        const fx = new Function("context", "msg", "payload", "http", code);
        return fx;
    }
    return null;
}

node.prepare = (properties, context) => {
    const fx = buildExecutionFunction(properties);
    const preparation = { function: fx };
    return preparation;
}

node.execute = async (context, msg) => {
    const preparation = context.preparation;

    if (!!preparation.function) {
        return preparation.function.call(context, context, msg, msg?.payload, axios);
    }

    context.continueWith({payload:{}});
}

exports.userFx = node;