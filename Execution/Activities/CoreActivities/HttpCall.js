const { default: axios } = require("axios");

const node = {};
node.type = 'http:call';

async function httpGet(url, config) {
    return await axios.get(url, config);
}

async function httpPost(url, data, config) {
    return await axios.post(url, data, config);
}

async function httpPut(url, data, config) {
    return await axios.put(url, data, config);
}

async function httpDelete(url, config) {
    return await axios.delete(url, config);
}

async function httpPatch(url, data, config) {
    return await axios.patch(url, data, config);
}

node.prepare = (properties) => {
    const preparation = { ...properties };
    return preparation;
}

node.execute = async (context, msg) => {
    const preparation = context.preparation;
    const { method, url, options } = preparation;

    //todo take care of options and configs
    const config = {}
    const data = msg.payload;
    let value = null;

    switch (method) {
        case 'GET': value = await httpGet(url, config); break
        case 'POST': value = await httpPost(url, data, config); break
        case 'PUT': value = await httpPut(url, data, config); break
        case 'DELETE': value = await httpDelete(url, config); break
        case 'PATCH': value = await httpPatch(url, data, config); break
    }

    const ret = { payload: value }

    context.continueWith(ret);
}

exports.httpcall = node;