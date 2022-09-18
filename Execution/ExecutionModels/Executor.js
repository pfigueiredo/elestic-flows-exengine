const { Storage } = require('./Storage');

class ExecutionContext {
    constructor(activity, engine) {
        this.engine = engine;
        this.$flow = activity.flow;
        this.continuations = [];
        this.$activity = activity;
        this.preparation = {};
        this.$storage = {};
        if (activity?.node?.prepare)
            this.preparation = activity.node.prepare(activity.properties, this);
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
        try {
            this.engine?.logger.log(message);
        } catch (err) { 
            console.log(err);
        }
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
                await this.executionFunction.apply(this.context, [this.context, message]);
            } catch (err) {

                const error = {};
                error.message = err?.message ?? "Flow error check log for details";
                error.name = err?.name;
                error.line = err?.lineNumber;
                error.column = err?.columnNumber;
                error.address = this.activity?.address;
                error.activity = this.activity?.name;

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
        context.continueWith(message);
    }

}


exports.Executor = Executor;