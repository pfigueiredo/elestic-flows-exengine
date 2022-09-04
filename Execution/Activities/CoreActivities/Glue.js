
const node = {};
node.type = 'core:glue';

//in preparation we can define stuff that will be needed for execution...
node.prepare = (properties) => {
    const preparation = { ...properties };
    return preparation;
}

node.execute = async (context, msg) => {
    const preparation = context.preparation;
    //{ items: 'NewArray', mutateMessage: false, source: 'myNumber' }
    const { items, mutateMessage, source } = preparation;
    let stop = false;

    //if not already glueing
    if (!context.glueArray) context.glueArray = [];
    var item = msg?.payload[source];

    if (item && item.length) {
        context.glueArray.push(item.value);
        if (context.glueArray.length == item.length) {
            stop = true;
        }
    } else {
        context.glueArray.push(item);
        if (context.queueLenght() == 0)
            stop = true;
    }

    if (stop) {
        const retMsg = {payload:{ }};
        retMsg.payload[items] = context.glueArray;
        context.glueArray = null;
        context.continueWith(retMsg);
        return retMsg;
    }

    return null;
}

exports.glue = node;