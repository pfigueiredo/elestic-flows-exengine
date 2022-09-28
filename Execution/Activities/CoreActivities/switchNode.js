const { getters } = require('./Common');

const node = {};
node.type = 'core:if';

/**
 * OR: 0
 * XOR: 1
 */

const typeOR = "1";
const typeXOR = "0";

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

function makeSwitchValueGetter(origin, expression) {
    switch (origin) {
        case '0': return getters.createStringExecutor(expression); break;
        case '1': return getters.createNumberExecutor(expression); break;
        default: return getters.createNumberExecutor("0"); break;
    }
}

node.prepare = (properties, context) => {
    const preparation = {}
    preparation.type = properties.type ?? 0;
    preparation.origin = properties.origin ?? 0;
    preparation.expression = properties.expression ?? "";
    preparation.values = properties.values ?? [];
    context.prepareFxApi();

    preparation.valueGetter = makeGetter(preparation.origin, preparation.expression);

    preparation.expressions = preparation.values.map(b => {
        return {
            valueGetter: makeSwitchValueGetter(b.valueType, b.value)
        }
    });

    return preparation;
}

node.execute = async (context, msg) => {
    const preparation = context.preparation;
    const process = context.process;
    const activity = context.activity;
    const flow = context.flow;

    let baseValue = await preparation.valueGetter.call({}, msg, msg.payload, activity, process, flow);

    for (let i = 0; i < preparation.expressions.length; i++) {
        const valueExpression = preparation.expressions[i];
        const value = await valueExpression.valueGetter.call();
        const result = baseValue == value;

        if (result) {
            context.continueWith(msg, i);
        }

        if (result && preparation.type == typeXOR)
            break;
    }

    if ((context.continuations?.length ?? 0) == 0)
        context.logger?.warn("Switch ended without continuations");

}

exports.switchNode = node;