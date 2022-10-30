
const { generateGetter, generateSetter } = require('./Common');

const node = {};
node.type = 'core:end';

node.prepare = (properties) => {
    const preparation = {};
    const origin = properties.origin ?? "9";
    const expression = properties.expression = "payload";
    preparation.valueGetter = generateGetter(origin, expression);
    return preparation;
}

node.execute = async (context, msg) => {
    const preparation = context.preparation;
    let { valueGetter } = preparation;
    const process = context.process;
    const activity = context.activity;
    const flow = context.flow;
    const data = await valueGetter.call({}, msg, msg.payload, activity, process, flow);
    context.prepareResponse(data);
}

exports.end = node;