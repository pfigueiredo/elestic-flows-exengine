
const node = {};
node.type = 'core:example';

node.prepare = (properties) => {
    const preparation = { ...properties };
    return preparation;
}

node.execute = async (context, msg) => {
    const preparation = context.preparation;
    context.continueWith({payload:{}});
}

exports.example = node;