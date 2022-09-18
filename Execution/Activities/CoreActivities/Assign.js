const { default: axios } = require("axios");

const assign = {}

assign.type = "core:assign";

function createHttpExecutor(url) {
    return async () => { 
        const response = await axios.get(url); 
        return response.data;
    }
}

function createJsExecutor(code) {
    return async (bag, msg, payload, activity, process, flow) => {
        const fx = new Function("msg", "payload", "activity", "process", "flow", `return ${code}`);
        return fx.call(bag, msg, payload, activity, process, flow)
    }
}

function createNumberExecutor(value) {
    return async () => {
        if (!isNaN(value))
            return parseFloat(value);
        else 
            return null;
    }
}

function createStringExecutor(value) {
    return async () => { 
        return value?.toString(); 
    }
}

function createTransformationExecutor(value) {
    return async () => null;
}

assign.prepare = (properties, context) => {
    const preparation = {}
    preparation.type = properties.type ?? 0;
    preparation.mutateMessage = properties.mutateMessage ?? false;
    context.prepareFxApi();

    if (!!properties.assignments) {
        preparation.assignments = properties.assignments.map(a => {
            switch (a.type?.toString()) {
                case '0': return { item: a.item, getValue: createStringExecutor(a.value), type: a.type }
                case '1': return { item: a.item, getValue: createNumberExecutor(a.value), type: a.type }
                case '2': return { item: a.item, getValue: createJsExecutor(a.value), type: a.type }
                case '3': return { item: a.item, getValue: createTransformationExecutor(a.value), type: a.type }
                case '4': return { item: a.item, getValue: createHttpExecutor(a.value), type: a.type }
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
        const value = await assign.getValue.call(null, bag, msg, msg.payload, activity, process, flow);

        //update this reference inside eventual assigns in the current loop
        bag[item] = value;

        switch(preparation.type.toString()) {
            case '0': returnMessage.payload[item] = value;
            case '1': returnMessage[item] = value;
            case '2': process.data.setValue(item, value);
            case '3': flow.data.setValue(item, value);
            case '4': activity.data.setValue(item, value);
        }
    }
    

    context.continueWith(returnMessage);
    return returnMessage;
}

exports.assign = assign;