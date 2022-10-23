
const node = {};
node.type = 'core:break';

node.prepare = (properties) => {
    const preparation = { ...properties };
    return preparation;
}

node.execute = async (context, msg) => {
    const preparation = context.preparation;
    const scope = context.getCurrentScope();
    scope.break = true;

    if (scope && scope.address) {
        const jumpToAddress = scope.address;
        context.jumpTo(msg, jumpToAddress);
    } else
        context.logger.warn('no current scope to jump to');

}

exports.breakLoop = node;