
const node = {};
node.type = 'core:trigger';

function prepateResponse(input, preparation) { return {...input.payload }; }
function prepareEFlowTrigger(input, preparation) { return {...input.payload }; }

node.prepare = (properties) => {
    const preparation = { ...properties };
    return preparation;
}

node.execute = async (context, msg) => {
    const preparation = context.preparation;
    let { type } = preparation;
    const retMsg = { ...msg }

    if (!type) type = "response";

    switch (type) {
        case "response": context.prepareResponse(prepateResponse(msg, preparation)); break; //http
        case "e-flow": context.prepareTrigger(prepareEFlowTrigger(msg, preparation)); break; //e-flow
    }

    context.continueWith(retMsg);
}

exports.trigger = node;