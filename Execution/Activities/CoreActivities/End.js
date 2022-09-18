
const node = {};
node.type = 'core:end';

function prepateResponse(input, preparation) { return {...input.payload }; }

node.prepare = (properties) => {
    const preparation = { ...properties };
    return preparation;
}

node.execute = async (context, msg) => {
    const preparation = context.preparation;
    let { type } = preparation;

    if (!type) type = "response";
    context.prepareResponse(prepateResponse(msg, preparation));
}

exports.end = node;