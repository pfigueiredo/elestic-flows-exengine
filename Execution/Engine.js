const crypto = require('crypto');
const {performance} = require('perf_hooks');
const { FlowExecutionModel } = require("./ExecutionModels/FlowExecutionModel");
const { getFlow, getEntryPoints } = require("./FlowsDb");
const { Message } = require("./ExecutionModels/Message");
const { Dictionary } = require("./Utils/Dictionary");
const { FlowInvoker } = require('./FlowInvoker');
const { getLogger } = require('../Logger');

const flowCache = new Dictionary();

/**
 * @property { FlowExecutionModel } flow
 * @property { string } flowId
 */
class Engine {

    constructor() {
        this.flow = null;
        this.flowId = null;
        this.entryPoints = null;
        this.response = null;
        this.processId = null;
        this.statistics = {
            start: {
                engine: performance.now(),
            },
            duration: { },
            end: { }
        }
    }

    prepareLogger() {
        this.logger = getLogger(this.flowId, this.processId, this.executionId);
        this.logger.log(`logger built for processs: ${this.processId} ${this.executionId}`)
    }

    createNewInstance(keepExecutionId) {
        const engine = new Engine();
        if (keepExecutionId) {
            engine.executionId = this.executionId
            engine.logger = this.logger;
        }
        return engine;
    }

    startEvent() {
        this.statistics.start.run = performance.now()
    }

    endEvent() {
        this.statistics.end.run = performance.now();
        this.statistics.duration.run = this.statistics.end.run - this.statistics.start.run;
        this.statistics.duration.total = this.statistics.end.run - this.statistics.start.run;
        this.statistics.duration.life = this.statistics.end.run - this.statistics.start.engine;

        if (this.logger) {
            this.logger.info('execution statistics');
            this.logger.log(this.statistics.duration);
        }
    }

    async flushLogs() {
        if (this.logger) await this.logger.flushLogs();
    }

    getReturnObject() {
        return { 
            body: this.response ?? this.lastError,
            code: (!!this.lastError) ? 500 : 200
        }
    }

    loadFlow = async (flowId) => {
        return await getFlow(flowId);
    }

    loadEntryPoints = async () => {
        return await getEntryPoints();
    }

    findEntryPointByEventType = async (eventType) => {

        if (!this.entryPoints) {
            this.entryPoints = await this.loadEntryPoints();
        }

        for (let f = 0; f < this.entryPoints?.length ?? 0; f++) {
            const epFlow = this.entryPoints[f];
            for (let e = 0; e < epFlow?.entryPoints?.length ?? 0; e++) {
                const ep = epFlow.entryPoints[e];
                if (!ep.type) ep.type = 'http';
                if (!ep.method) ep.method = 'ANY';
                if (
                    !!ep.entryPoint && ep.entryPoint === eventType.entryPoint
                    && ep.type === eventType.type 
                    && (ep.method === eventType.method)
                )
                    return { ...ep, flowId: epFlow.flowId };
            }
        }

        return null;

        //return 'e13e8c8e-352a-47b6-af63-ff580e1cb1dd';
        //return '9076a639-2dc3-40c8-a8e3-8c6b794e3d8e';
        //return 'e909f59b-ac6e-4d1f-8334-251e49aca067'
        //return "146693a4-cd80-4198-b82c-7fb66b67d64e"; //todo find the flow using eventType.type and eventType.entryPoint
    }

    loadAfterPreparation = async () => {
        this.logger.log('-- START --------------------------------------------------');
        this.logger.log(`loading '${this.flowId}' flow data...`);
        const execMilis = Date.now();

        let loadFromDb = false;
        let foundInCache = !!flowCache.containsKey(this.flowId);

        if (foundInCache) {
            this.logger.log(`${this.flowId} found in flow-cache loading from cache`);
            this.flow = flowCache.get(this.flowId);
            const age = execMilis - this.flow.loadedAt;
            this.logger.log(`${this.flowId} loaded from cache, checking age ${age}`);
            if (age > (60 * 1000)) {
                loadFromDb = true;
                this.flow = null;
                this.logger.warn(`${this.flowId} flow is too old ${age}`);
            }
        }

        if (!foundInCache || loadFromDb) {
            const flowData = await this.loadFlow(this.flowId);
            this.logger.log(`flow data loaded from db, creating execution model`);
            this.flow = new FlowExecutionModel(flowData);
            this.flow.loadedAt = Date.now();
            flowCache.add(this.flowId, this.flow);
        }

        
        this.statistics.end.loadFlow = performance.now();
        this.statistics.duration.loadFlow = this.statistics.end.loadFlow - this.statistics.start.loadFlow;
    }

    prepareFlow = async (flowId, processId) => {
        this.statistics.start.loadFlow = performance.now();
        this.flowId = flowId
        this.processId = processId ?? crypto.randomUUID();
        this.executionId = crypto.randomUUID();

        if (!this.flowId) { 
            console.error(`flow not found!! ${this.flowId}`);
            return null;
        }

        this.prepareLogger();

        await this.loadAfterPreparation();
    }

    prepareExecution = async (eventType, processId) => {
        this.statistics.start.loadFlow = performance.now();
        const ep = await this.findEntryPointByEventType(eventType);
        this.flowId = ep?.flowId
        this.processId = processId ?? crypto.randomUUID();
        this.executionId = crypto.randomUUID();

        if (!this.flowId) { 
            console.error(`flow not found!! ${this.flowId}`);
            return null;
        }

        if (!this.logger)
            this.prepareLogger();

        await this.loadAfterPreparation();
        return ep;
    }

    /**
     * @param {Message} startMessage 
     */
    execute = async (startMessage, entryPoint) => {

        this.statistics.start.run = performance.now();

        if (!startMessage.next?.address) {
            if (!!entryPoint) {
                startMessage.next = this.flow.getStepInfoFromEntryPoint(entryPoint);
            } else
                startMessage.next = this.flow.findEntryPointStep(startMessage.trigger);
        }

        const messages = [ startMessage ];
        let message = null;
        let returnMessage = null;

        //TODO: check bailout on execution timeout. ?? think a bit about that
        while (!!(message = messages.pop())) {

            this.queueLength = messages.length + 1;

            if (!!message?.next) {

                /**
                 * @var {StepInfo} stepInfo
                 */
                const stepInfo = message.next;
                const step = await this.flow.getExecutionStep(stepInfo.address);

                
                const executor = step.getExecutor(this);
                this.logger.info(`executing ${step.address} of type ${step.type} (${executor?.getName()})`)
                if (!!executor?.exec) {
    
                    const result = await executor.exec(message);
                    if (!!result && result.continueWith) {   
                        
                        const continuations = result.continueWith;
                        if (!!continuations) {
                            for (let c = 0; c < continuations.length; c++) {
                                let nextMsg = continuations[c].message;
                                nextMsg.next = continuations[c].next;
                                if (!!nextMsg.next?.address) { 
                                    if (nextMsg.next.remote) {
                                        const invoker = new FlowInvoker(this);
                                        await invoker.invokeStep(nextMsg, this.processId, "trigger");
                                        this.logger.log(`triggering a remote step ${nextMsg.next.address}`);
                                    } else
                                        messages.push(nextMsg);
                                } else 
                                    returnMessage = nextMsg;
                            }
                        }

                        if (!!result.error) {
                            this.lastError = result.error;
                            this.response = result.response;
                            break;
                        }

                        if (!!result.response) {
                            this.logger.log('got response from flow, execution can continue but it normaly indicates the end for this execution');
                            this.response = result.response;
                        }

                        if (!!result.yield_execution) { 
                            this.logger.log('got yield execution');
                            //todo: store the messages queue and return;
                        }

                        if (result.trigger) {
                            this.logger.log('got trigger execution');
                            //todo trigger the execution of another flow...
                        }

                    }
                }
            }
        }

        this.logger.log('returning from execution loop');
        return returnMessage ?? this.response;
    }

}

exports.Engine = Engine;