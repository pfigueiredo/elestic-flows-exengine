const AWS = require('aws-sdk');
const { StepInfo } = require('../../ExecutionModels/Message');
const { FlowInvoker } = require('../../FlowInvoker');

const node = {};
node.type = 'core:call';

const invokeFlow = async function(engine, flowId, type, entryPoint, processId, msg) {
    const invoker = new FlowInvoker(engine);
    let ret = {}

    const next = new StepInfo({flowId: flowId, address: null});
    msg.next = next;

    if (type === "proc") {
        ret = await invoker.invokeLocalEndPoint(msg, entryPoint, processId);
    } else if (type === "remote")
        ret = await invoker.invokeEndPoint(msg, entryPoint, processId, "call");

    return ret;
}



node.prepare = (properties) => {
    const preparation = { ...properties };
    return preparation;
}

node.execute = async (context, msg) => {
    const preparation = context.preparation;
    const processId = context.engine?.processId;
    const { type, flowId, entryPoint } = preparation;

    const ret = await invokeFlow(context.engine, flowId, type ?? "proc", entryPoint, processId, msg);

    context.continueWith({ ...msg, payload:ret });
}

exports.call = node;