const { Storage } = require('./Storage');
const { ExecutionStorage } = require('./ExecutionStorage');

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
        this.$execStorage = null;
        this.prepared = false;
        this.console = new ExecutionConsole(this);
    }

    $setScope(scope) {
        this.$scope = { 
            ...scope, //the data in the scope can be shared não big deal.
            stack: [ //avoid mutations of scope with multiple paths in the same process.
                ...(scope?.stack ?? [])
            ] 
        }
    }

    clearActivityScope() {
        const address = this.$activity.address;
        if (this.$scope?.stack?.length > 0) {
            const index = this.$scope.stack.indexOf(address);
            if (index >= 0)
                this.$scope.stack.splice(index, 1);

            if (this.$scope.activities[address])
                delete this.$scope.activities[address];
        }
    }

    getCurrentScope() {
        if (this.$scope?.stack?.length > 0) {
            const currentScopeAddress = this.$scope.stack[0];
            return this.$scope.activities[currentScopeAddress] ?? null;
        } 
        return null;
    }

    getActivityScope() {
        if (!this.$scope.activities) this.$scope.activities = {}
        const activitiesScope = this.$scope.activities;
        const address = this.$activity.address;

        if (!activitiesScope[address]) {
            activitiesScope[address] = { address: address }
            if (!this.$scope.stack) this.$scope.stack = [];
            this.$scope.stack.unshift(address);
        }

        return activitiesScope[address];
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

    createContinuations(addresses, message) {
        if (addresses) {
            addresses.forEach(address => {
                this.continuations.unshift({
                    message: {... message },
                    next: address,
                    $scope: this.$scope
                }); 
            });    
        }
    }

    jumpTo(message, address) {
        const destination = this.$flow?.getActivity(address);
        if (destination) {
            const stepInfo = destination.getJumpAddress();
            this.createContinuations([stepInfo], message);
        } else
            this.logger.warn(`can't jump to address ${address}, activity not found in flow`);
    }

    async storeExecutionData(message, isDebug) {
        if (!this.$execStorage) this.$execStorage = new ExecutionStorage();
        return await this.$execStorage.storeExecutionData(
            this.engine.processId, 
            this.engine.executionId,
            this.$flow.flowId,
            this.$activity.address,
            isDebug, 
            false,
            message
        );
    }

    async pauseExecution(message, isDebug) {
        if (!this.$execStorage) this.$execStorage = new ExecutionStorage();
        return await this.$execStorage.storeExecutionData(
            this.engine.processId, 
            this.engine.executionId,
            this.$flow.flowId,
            this.$activity.address,
            isDebug, 
            true,
            message
        );
    }

    continueWith(message, output) {

        const addresses = this.$activity.getOutputAddresses(output ?? 0);

        if (addresses.length == 0)
            this.logger.warn("Got a continuation but didn't find any output/wire available for port " + (output ?? 0));

        this.createContinuations(addresses, message);
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

    setEngine(engine) {
        this.context.engine = engine;
        this.engine = engine;
    }

    getName() {
        return this.activity?.name;   
    }

    async exec (message) {
        if (!!this.executionFunction) {
            this.context.clean();
            this.context.$setScope(message.$scope ?? {});
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