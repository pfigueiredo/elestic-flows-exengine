const { generateJoiner } = require("./Common");

const node = {};
node.type = 'core:join';

node.prepare = (properties, context) => {
    const preparation = { ...properties };
    const activity = context.$activity;
    const inputs = activity.inputs;

    //check the number of inputs (wires) this activity have;
    preparation.inputs = inputs?.map(i => i.address) ?? [];
    preparation.joiner = generateJoiner(preparation.type, inputs, activity);

    return preparation;
}

node.execute = async (context, msg) => {
    const preparation = context.preparation;
    const process = context.process;
    const activity = context.activity;
    const flow = context.flow;
    const joiner = preparation.joiner;

    const joinResult = joiner(msg, activity, process, flow)

    if (joinResult.complete) {
        context.continueWith({payload:{ data: joinResult.data }});
    }
    
}

exports.example = node;