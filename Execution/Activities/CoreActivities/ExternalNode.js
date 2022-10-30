const { generateSetter, generateGetter } = require("./Common");

const node = {};
node.type = 'core:external';

node.prepare = (properties) => {
    const preparation = { ...properties };
    return preparation;
}

const ContinuePort = 0;
const PausePort = 1;

node.execute = async (context, msg) => {

    const continuation = !!context.$source?.external;

    if (continuation) { //am i continuing from a previous pause?
        context.logger.note("got continuation from external action/activity");
        context.continueWith(msg, ContinuePort);
    } else {
        const pauseData = await context.pauseExecution(msg, false);
        //todo: need to get the url of the service...
        pauseData.url = `~/continue/${pauseData.waitId}`;
        context.continueWith({ 
            payload: pauseData
        }, PausePort);
        context.logger.note("execution paused: waiting for external action/activity");
    }
}

exports.externalNode = node;