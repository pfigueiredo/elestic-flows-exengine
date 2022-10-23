const { generateGetter, generateSetter } = require('./Common');

const node = {};
node.type = 'core:foreach';

node.prepare = (properties) => {

    const preparation = { };

    preparation.listOrigin = properties.listOrigin ?? "8";
    preparation.listExpression = properties.listExpression ?? "";
    preparation.elementVarDest = properties.elementVarDest ?? "0";
    preparation.elementVar = properties.elementVar ?? "element";
    
    preparation.listGetter = generateGetter(preparation.listOrigin, preparation.listExpression);
    preparation.elementSetter = generateSetter(preparation.elementVarDest, preparation.elementVar);
    
    return preparation;
}

const ContinuePort = 1;
const BreakPort = 0;

node.execute = async (context, msg) => {
    const preparation = context.preparation;
    const process = context.process;
    const activity = context.activity;
    const flow = context.flow;
    const scopeInfo = context.getActivityScope();

    if (scopeInfo.break) {
        context.clearActivityScope();
        context.continueWith(msg, BreakPort); //break;
        return;
    }

    const list = await preparation.listGetter.call({}, msg, msg.payload, activity, process, flow);
    const index = (scopeInfo.index ?? -1) + 1;
    let element = null;

    if (index >= 0 && index < (list?.length ?? 0)) {
        element = list[index];
        scopeInfo.index = index;
        await preparation.elementSetter.call({}, msg, msg.payload, activity, process, flow, element);
        context.continueWith(msg, ContinuePort); //next
    } else {
        context.clearActivityScope();
        context.continueWith(msg, BreakPort); //end
    }
}

exports.forEach = node;