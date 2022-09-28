const { getters } = require('./Common');

const assign = {}

assign.type = "core:assign";

assign.prepare = (properties, context) => {
    const preparation = {}
    preparation.type = properties.type ?? 0;
    preparation.mutateMessage = properties.mutateMessage ?? false;
    context.prepareFxApi();

    if (!!properties.assignments) {
        preparation.assignments = properties.assignments.map(a => {
            switch (a.type?.toString()) {
                case '0': return { item: a.item, getValue: getters.createStringExecutor(a.value), type: a.type }
                case '1': return { item: a.item, getValue: getters.createNumberExecutor(a.value), type: a.type }
                case '2': return { item: a.item, getValue: getters.createJsExecutor(a.value), type: a.type }
                case '3': return { item: a.item, getValue: getters.createTransformationExecutor(a.value), type: a.type }
                case '4': return { item: a.item, getValue: getters.createHttpExecutor(a.value), type: a.type }
                case '5': return { item: a.item, getValue: getters.createStorageExecutor(a.value, "F"), type: a.type }
                case '6': return { item: a.item, getValue: getters.createStorageExecutor(a.value, "A"), type: a.type }
                case '7': return { item: a.item, getValue: getters.createStorageExecutor(a.value, "P"), type: a.type }
                case '8': return { item: a.item, getValue: getters.createPayloadExecutor(a.value), type: a.type }
                case '9': return { item: a.item, getValue: getters.createMsgExecutor(a.value), type: a.type }
            }
            return a;
        });      
    }
    return preparation;
}

assign.execute = async (context, msg) => {

    const preparation = context.preparation;
    const returnMessage = (preparation.mutateMessage) ? {...msg, payload: {...msg?.payload ?? {}}} : { payload: {} };

     
    const process = context.process;
    const activity = context.activity;
    const flow = context.flow;

    let bag = {};

    for (let i = 0; i < preparation.assignments.length; i++) {
        const assign = preparation.assignments[i];
        const item = assign.item;
        const value = await assign.getValue.call(bag, msg, msg.payload, activity, process, flow);

        //update this reference inside eventual assigns in the current loop
        bag[item] = value;

        switch(preparation.type.toString()) {
            case '0': returnMessage.payload[item] = value; break;
            case '1': returnMessage[item] = value; break;
            case '2': process.data.setValue(item, value); break;
            case '3': flow.data.setValue(item, value); break;
            case '4': activity.data.setValue(item, value); break;
        }
    }
    

    context.continueWith(returnMessage);
    return returnMessage;
}

exports.assign = assign;