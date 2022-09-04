
const node = {};
node.type = 'core:start';

function prepateHttpPayload(input) { return {...input }; }
function prepareSQSPayload(input) { return {...input }; }
function prepareS3Payload(input) { return {...input }; }
function prepareEFlowPayload(input) { return {...input }; }

node.prepare = (properties) => {
    const preparation = { ...properties };
    return preparation;
}

node.execute = async (context, msg) => {
    const preparation = context.preparation;
    const { type, endpoint } = preparation;
    const retMsg = { ...msg }

    switch (type) {
        case "http": retMsg.payload = prepateHttpPayload(msg.payload); //http
        case "sqs": retMsg.payload = prepareSQSPayload(msg.payload); //sqs
        case "s3": retMsg.payload = prepareS3Payload(msg.payload); //s3
        case "e-flow": retMsg.payload = prepareEFlowPayload(msg.payload); //e-flow
    }

    context.continueWith(retMsg);
}

exports.example = node;