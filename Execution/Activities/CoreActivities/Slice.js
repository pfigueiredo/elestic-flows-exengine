
const node = {};
node.type = 'core:slice';

node.prepare = (properties) => {
    const preparation = { ...properties };
    return preparation;
}

node.execute = async (context, msg) => {
    const preparation = context.preparation;
    const {source, item, includeSliceData} = preparation;
    let array = [];

    switch(preparation.type.toString()) {
        case '0': array = msg.payload[source]; break;
        case '1': array = msg[source]; break;
        case '2': array = process.getValue(source); break;
        case '3': array = flow.getValue(source); break;
        case '4': array = activity.getValue(source); break;
    }

    for (let i = 0; i < array.length; i++) {
        const retMsg = (preparation.mutateMessage) ? {...msg, payload: { }} : { payload: { }};
        if (includeSliceData)
            retMsg.payload[item] = { value: array[i], index: i, length: array.length }
        else
            retMsg.payload[item] = array[i];
        context.continueWith(retMsg);
    }

    /**
  includeSliceData: true,   
  item: 'myNumber',
  mutateMessage: true,      
  source: 'payload',        
  type: '1'
     */


}

exports.slice = node;