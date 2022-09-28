const { Storage } = require('./Storage');

let trace = null;

class ExecutionConsole {

    constructor(context) {
        this.context = context;
    }

    note() {
        const logger = this.context.engine.logger;
        logger.user_note.apply(logger, arguments);
    }

    debug() {
        const logger = this.context.engine.logger;
        logger.user_debug.apply(logger, arguments);
    }

    log() {
        const logger = this.context.engine.logger;
        logger.user_log.apply(logger, arguments);
    }

    info() {
        const logger = this.context.engine.logger;
        logger.user_info.apply(logger, arguments);
    }

    warn() {
        const logger = this.context.engine.logger;
        logger.user_warn.apply(logger, arguments);
    }

    error() {
        const logger = this.context.engine.logger;
        logger.user_error.apply(logger, arguments);
    }
}

class ExecutionContext {
    constructor(activity, engine) {
        this.engine = engine;
        this.$flow = activity.flow;
        this.continuations = [];
        this.$activity = activity;
        this.preparation = {};
        this.$storage = {};
        this.prepared = false;
        this.console = new ExecutionConsole(this);
    }

    prepare() {
        if (this.$activity?.node?.prepare)
            this.preparation = this.$activity.node.prepare(this.$activity.properties, this);
        this.prepared = true;
    }

    prepareFxApi() {
        this.flow = { flowId: this.$flow.flowId };
        this.activity = { flowId: this.$flow.flowId, activityId: this.$activity.address };
        this.process = { processId: this.engine.processId };

        this.flow.data = this.getFlowStorage();
        this.activity.data = this.getActivityStorage();
        this.process.data = this.getProcessStorage();
    }

    getActivityStorage() {
        const name = "activity";
        if (!!this.$storage[name]) return this.$storage[name];
        const storeKey = `A#${this.$flow.flowId}#${this.$activity.address}`;
        return this.$storage[name] = new Storage(name, storeKey);
    }

    getFlowStorage() {
        const name = "flow";
        if (!!this.$storage[name]) return this.$storage[name];
        const storeKey = `F#${this.$flow.flowId}`;
        return this.$storage[name] = new Storage(name, storeKey);
    }

    getProcessStorage() {
        const name = "process";
        if (!!this.$storage[name]) return this.$storage[name];
        const storeKey = `P#${this.engine.processId}`;
        return this.$storage[name] = new Storage(name, storeKey);
    }

    queueLength() { return this.engine.queueLength; }

    clean() {
        this.continuations = [];
    }

    stop() {
        this.yield_execution = true;
        this.stop = true;
    }

    log(message) {
        this.console.log(message);
        this.engine.logger.warn("usage of context.log is deprecated please use context.console.log");
    }

    prepareTrigger(trigger) {
        this.trigger = trigger;
    }

    prepareResponse(response, yield_execution) {
        this.response = response;
        this.yield_execution = yield_execution;
    }

    tryCatch(message) {
        const address = this.$flow.getErrorHandler();
        if (address) {
            this.continuations.unshift({
                message: {... message },
                next: address
            });
            return true;
        }
        return false;
    }

    continueWith(message, output) {

        const addresses = this.$activity.getOutputAddresses(output ?? 0);

        if (addresses.lenght == 0)
            this.logger.warn("Got a continuation but didn't find any output/wire available for port " + (output ?? 0));

        addresses.forEach(address => {
            this.continuations.unshift({
                message: {... message },
                next: address
            }); 
        });
        return message;
    }
}

class Executor {

    constructor(activity, node, customFunction, engine) {
        this.executionFunction = node?.execute ?? customFunction ?? this.deafultExec;
        this.activity = activity;
        this.context = new ExecutionContext(this.activity, engine);
        this.engine = engine;
    }

    getName() {
        return this.activity?.name;   
    }

    async exec (message) {
        if (!!this.executionFunction) {
            this.context.clean();
            try {
                if (!this.context.prepared)
                    this.context.prepare();

                await this.executionFunction.apply(this.context, [this.context, message]);
            } catch (err) {

                // let errorTrace = null;

                // if (!trace)
                //     trace = await import('stack-trace');

                // if (trace.parse)
                //     errorTrace = trace.parse(err);
                
                //     console.log(err.stack);

                console.error(err);

                const error = {};
                error.message = err?.message ?? "Flow error check log for details";
                error.name = err?.name;
                error.line = err?.lineNumber;
                error.column = err?.columnNumber;
                error.address = this.activity?.address;
                error.activity = this.activity?.name;
                //error.trace = errorTrace;

                const errMsg = {
                    error: true,
                    payload: { 
                        error: error,
                        address: this.activity?.address,
                        activity: this.activity?.name
                    }
                }

                this.engine.logger.error(error);

                if (!this.context.tryCatch(errMsg))
                    this.context.error = errMsg;

            }
            return {
                continueWith: this.context.continuations,
                response: this.context.response,
                yield_execution: this.context.yield_execution,
                trigger: this.context.trigger,
                error: this.context.error
            }
        }
    }

    deafultExec (context, message) {
        context.logger?.warn("Default executor called, is this node defined?")
        context.continueWith(message);
    }

}


exports.Executor = Executor;