const { generateGetter, generateSetter } = require('./Common');

const node = {};
node.type = 'core:foreach';

node.prepare = (properties) => {

    const preparation = { };

    preparation.iteratorVarDest = properties.iteratorVarDest ?? "0";
    preparation.iteratorVar = properties.iteratorVar ?? "index";
    preparation.limitOrigin = properties.limitOrigin ?? "1";
    preparation.limitExpression = properties.limitExpression ?? "";
    preparation.stepOrigin = properties.stepOrigin ?? "1";
    preparation.stepExpression = properties.stepExpression ?? "1";
    
    preparation.limitGetter = generateGetter(preparation.limitOrigin, preparation.limitExpression);
    preparation.stepGetter = generateGetter(preparation.stepOrigin, preparation.stepExpression);
    preparation.iteratorSetter = generateSetter(preparation.iteratorVarDest, preparation.iteratorVar);
    
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

    const limitValue = await preparation.limitGetter.call({}, msg, msg.payload, activity, process, flow);
    const stepValue = await preparation.stepGetter.call({}, msg, msg.payload, activity, process, flow);

    const index = (scopeInfo.index ?? -1) + (stepValue);
    const doNext = (stepValue > 0 && index < limitValue) || (stepValue < 0 && index > limitValue);

    if (doNext) {
        scopeInfo.index = index;
        await preparation.iteratorSetter.call({}, msg, msg.payload, activity, process, flow, index);
        context.continueWith(msg, ContinuePort); //next
    } else {
        context.clearActivityScope();
        context.continueWith(msg, BreakPort); //end
    }
}

exports.forLoop = node;