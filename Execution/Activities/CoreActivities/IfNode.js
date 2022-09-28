const { getters } = require('./Common');

const node = {};
node.type = 'core:if';

/**
 * ANY: 0 = OR
 * ALL: 1 = AND
 */

const typeOR = "0";
const typeAND = "1";

function makeGetter(origin, expression) {
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
        default: return getters.createNumberExecutor("0"); break;
    }
}

//TODO Allow this functions to work with arrays as well as strings
function startsWith(A, B) {
    return (A, B) => { return (A?.toString() ?? "").startsWith(B?.toString() ?? ""); };
}

function endsWith(A, B) {
    return (A, B) => { return (A?.toString() ?? "").startsWith(B?.toString() ?? ""); };
}

function contains(A, B) {
    return (A?.toString() ?? "").indexOf(B?.toString() ?? "") >= 0;
}

function isPresentIn(A, B) {
    return contains(B, A);
}

function returnFalse(A, B) {
    return false;
}

function makeComparer(compareOption) {
    switch (compareOption) {
        case "0": return (A, B) => { return A == B };
        case "1": return (A, B) => { return A != B };
        case "2": return (A, B) => { return A > B };
        case "3": return (A, B) => { return A >= B };
        case "4": return (A, B) => { return A < B };
        case "5": return (A, B) => { return A <= B };
        case "6": return startsWith;
        case "7": return endsWith;
        case "8": return contains;
        case "9": return isPresentIn;
        default: returnFalse;
    }
}

node.prepare = (properties, context) => {
    const preparation = {}
    preparation.type = properties.type ?? 0;
    preparation.booleans = properties.booleans ?? [];
    context.prepareFxApi();

    preparation.expressions = preparation.booleans.map(b => {
        return {
            valueAGetter: makeGetter(b.valueTypeA, b.valueA),
            valueBGetter: makeGetter(b.valueTypeB, b.valueB),
            compareGetter: makeComparer(b.compareOption)
        }
    });

    let getter = null;

    
    preparation.getter = getter;
    return preparation;
}

node.execute = async (context, msg) => {
    const preparation = context.preparation;
    const process = context.process;
    const activity = context.activity;
    const flow = context.flow;

    //To allow a bailout before the end of the evaluation as proper ifs and boolean expressions do
    let ifResult = (preparation.type == typeAND);

    for (let i = 0; i < preparation.expressions.length; i++) {
        const expression = preparation.expressions[i];
        const valueA = await expression.valueAGetter.call({}, msg, msg.payload, activity, process, flow);
        const valueB = await expression.valueBGetter.call({}, msg, msg.payload, activity, process, flow);
        const result = expression.compareGetter.call(null, valueA, valueB);

        if (preparation.type == typeOR) {
            ifResult |= result;
            if (ifResult) break; //bail out;
        } else if (preparation.type == typeAND) {
            ifResult &= result;
            if (!ifResult) break; //bail out;
        }
    }

    if (ifResult) 
        context.continueWith(msg, 0);
    else
        context.continueWith(msg, 1);
}

exports.ifNode = node;