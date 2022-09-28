
const node = {};
node.type = 'core:fork';

node.prepare = (properties) => {
    const preparation = { ...properties };
    return preparation;
}

node.execute = async (context, msg) => {
    const preparation = context.preparation;
    const activity = context.$activity;

    for (let i = 0; i < (activity.outputs?.length ?? 0); i++) {
        context.continueWith(msg, i);
    }
}

exports.fork = node;