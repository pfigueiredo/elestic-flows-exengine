const { FlowExecutionModel } = require("./ExecutionModels/FlowExecutionModel");
const { getFlow, getEntryPoints } = require("./FlowsDb");
const { Message } = require("./ExecutionModels/Message");
const { Dictionary } = require("./Utils/Dictionary");

/**
 * @property { FlowExecutionModel } flow
 * @property { string } flowId
 */
class Engine {

    constructor() {
        this.flow = null;
        this.flowId = null;
        this.flowCache = new Dictionary();
        this.entryPoints = null;
        this.response = null;
        this.processId = null;
    }

    getReturnObject() {
        return { 
            body: this.response,
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
                    && (ep.method === eventType.method || ep.method === 'ANY')
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

    prepareExecution = async (eventType, processId) => {
        const ep = await this.findEntryPointByEventType(eventType);
        this.flowId = ep?.flowId
        this.processId = processId;

        if (!this.flowId) { 
            console.error('flow not found!!');
            //console.log(eventType);
            return null;
        }

        console.log('-- START --------------------------------------------------');
        console.log(`found flow: ${this.flowId} loading flow data...`);
        const execMilis = Date.now();

        let loadFromDb = false;
        let foundInCache = !!this.flowCache.containsKey(this.flowId);

        if (foundInCache) {
            console.log(`${this.flowId} found in flow-cache loading from cache`);
            this.flow = this.flowCache.get(this.flowId);
            const age = execMilis - this.flow.loadedAt;
            console.log(`${this.flowId} loaded from cache, checking age ${age}`);
            if (age > (60 * 1000)) {
                loadFromDb = true;
                this.flow = null;
            }
        }

        if (!foundInCache || loadFromDb) {
            const flowData = await this.loadFlow(this.flowId);
            console.log(`flow data loaded from db, creating execution model`);
            this.flow = new FlowExecutionModel(flowData);
            this.flow.loadedAt = Date.now();
            console.log(`model created`);
            this.flowCache.add(this.flowId, this.flow);
        }

        return ep;
    }

    /**
     * @param {Message} startMessage 
     */
    execute = async (startMessage) => {

        if (!startMessage.next?.address) {
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

                console.log(`preparing executor for ${step.address} of ${step.type}`)
                const executor = step.getExecutor(this);

                if (!!executor?.exec) {
    
                    const result = await executor.exec(message);
                    if (!!result && result.continueWith) {   
                        
                        const continuations = result.continueWith;
                        if (!!continuations) {
                            for (let c = 0; c < continuations.length; c++) {
                                let nextMsg = continuations[c].message;
                                nextMsg.next = continuations[c].next;
                                if (!!nextMsg.next?.address) 
                                    messages.push(nextMsg);
                                else 
                                    returnMessage = nextMsg;
                            }

                            if (!!result.error) {
                                this.lastError = result.error;
                            }

                            if (!!result.response) {
                                console.log('storing response');
                                this.response = result.response;
                            }

                            if (!!result.yield_execution) { 
                                console.log('yield execution');
                                //todo: store the messages queue and return;
                            }

                            if (result.trigger) {
                                console.log('trigger execution');
                                //todo trigger the execution of another flow...
                            }
                        }
                    }
                }
            }
        }
    
        return returnMessage;
    }

}

exports.Engine = Engine;