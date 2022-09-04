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

    getActivityStorage() {
        const name = "activity";
        if (!!this.$storage[name]) return this.$storage[name];
        const storeKey = `${this.$flow.flowId}#${this.$activity.address}`;
        return this.$storage[name] = new Storage(name, storeKey);
    }

    getFlowStorage() {
        const name = "flow";
        if (!!this.$storage[name]) return this.$storage[name];
        const storeKey = this.$flow.flowId;
        return this.$storage[name] = new Storage(name, storeKey);
    }

    getProcessStorage() {
        const name = "process";
        if (!!this.$storage[name]) return this.$storage[name];
        const storeKey = this.engine.processId;
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
        console.log(message);
    }

    prepareTrigger(trigger) {
        this.trigger = trigger;
    }

    prepareResponse(response, yield_execution) {
        this.response = response;
        this.yield_execution = yield_execution;
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
        this.executionFunction = customFunction ?? node?.execute ?? this.deafultExec;
        this.activity = activity;
        this.context = new ExecutionContext(this.activity, engine);
    }

    async exec (message) {
        if (!!this.executionFunction) {
            this.context.clean();
            try {
                await this.executionFunction.apply(this.context, [this.context, message]);
            } catch (err) {
                const errMessage = err?.message ?? err?.toString() ?? "Flow error check log for details";

                this.context.error = err;
                this.context.continueWith({
                    error: true,
                    payload: { 
                        error: errMessage,
                        address: this.activity?.address,
                        activity: this.activity?.name
                    }
                })
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