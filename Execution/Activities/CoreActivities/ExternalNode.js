
const node = {};
node.type = 'core:external';

node.prepare = (properties) => {
    const preparation = { ...properties };
    return preparation;
}

node.execute = async (context, msg) => {
    const preparation = context.preparation;
    const continuation = !!context.$source?.external;

    if (continuation) {
        context.logger.note("got continuation from external action/activity");
        context.continueWith(msg);
    } else {
        await context.pauseExecution(msg, false);
        context.logger.note("execution paused: waiting for external action/activity");
    }
}

exports.externalNode = node;