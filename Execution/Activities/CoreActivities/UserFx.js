const { default: axios } = require("axios");
const node = {};
node.type = 'core:function';

 const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

function buildExecutionFunction(properties) {
    if (!!properties?.functionCode) {
        const code = properties.functionCode;
        const fx = new AsyncFunction("context", "msg", "payload", "activity", "flow", "process", "http", code);
        return fx;
    }
    return null;
}

node.prepare = (properties, context) => {
    const fx = buildExecutionFunction(properties);
    const preparation = { function: fx };
    context.prepareFxApi();
    return preparation;
}

node.execute = async (context, msg) => {
    const preparation = context.preparation;

    if (!!preparation.function) {
        return await preparation.function.call(
            context, 
            context, msg, msg?.payload, 
            context.activity, context.flow, context.process, 
            axios
        );
    }

    context.continueWith({payload:{}});
}

exports.userFx = node;