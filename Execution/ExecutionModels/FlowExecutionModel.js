const { StepInfo } = require("./Message");
const { FlowAddress } = require("./FlowAddress");
const { nodes } = require('../Activities/Nodes');
const { Executor } = require("./Executor");

class FlowExecutionModel {
    constructor(data) {
        this.keySeed = 1;
        this.flowId = data.flowId;
        this.icon = data.icon;
        this.color = data.color;
        this.address = data.address ?? "";
        this.name = data.name ?? "unnamed flow";
        this.description = data.description ?? "";
        this.activities = (data.activities) ?
            data.activities.map(a => new ActivityExecutionModel(a, this))
            : [];

        this.entries = this.activities.filter(a => a.type === 'core:start');
        this.updateWires();
    }

    getExecutionStep(address) {
        const activity = this.getActivity(address);
        return activity;
    }

    findEntryPointStep(trigger) {
        //default
        const entryPoint = (this.entries.length > 0) ? this.entries[0] : null;
        return new StepInfo({flowId : this.flowId, address: entryPoint.address });
    }

    updateWires() {
        // this.activities.forEach(activity => {
        //     activity.outputs.forEach(o => {
        //         o.wires.forEach(w => {
        //             w.destination = this.getActivity(w.destinationAddress) ?? activity;
        //         })
        //     });
        // });
    }

    getActivity(address) {
        for (var i = 0; i < this.activities.length; i++)
            if (FlowAddress.SameActivity(this.activities[i].address, address))
                return this.activities[i];
        return null;
    }
};

class ActivityExecutionModel {
    constructor(data, flow) { 

        this.flow = flow;
        this.key = (++flow.keySeed);
        this.address = data.address ?? "A" + flow.keySeed;
        this.name = data.name ?? "unnamed activity";
        this.type = data.type ?? "unknown";
        this.node = nodes[this.type] ?? null;
        this.properties = data.properties ?? {}
        this.hasErrorOutput = data.hasErrorOutput ?? false;
        this.position = {
            x: data.position?.x ?? 100,
            y: data.position?.y ?? 100
        }

        this.outputs = (data.outputs)
             ? data.outputs.map((o, i, arr) => new IOExecutionModel(o, i, arr, this, "O"))
             : [];

        //actually we only support one input per node. **for now
        this.inputs = (data.inputs) 
            ? data.inputs.map((o, i, arr) => new IOExecutionModel(o, i, arr, this, "I"))
            : [];

        this.executionStep = null;
    }

    getOutputAddresses(index) {
        if (this.outputs.length > index)
            return this.outputs[index].connections.map((conn) => {
                return new StepInfo({
                    flowId: this.flow.flowId,
                    address: conn
                });
            });
        else 
            return [];
    }

    getExecutor(engine) {

        if (!this.executionStep) {
            const node = nodes[this.type] ?? null;
            return this.executionStep = new Executor(this, node, null, engine);
        }
        return this.executionStep;
    }

    connect(wire) {
        if (!!this.inputs && this.inputs.length > 0) {
            let io = this.inputs[0];
            io.connect(wire);
        }
    }

};

class IOExecutionModel {
    constructor(data, index, allPorts, activity, type) {
        this.key = ++activity.flow.keySeed;
        this.activity = activity;
        this.name = data.name ?? "";
        this.address = data.address ?? type + index;
        this.type = data.type ?? "sync";
        this.index = index;
        this.color = data.color ?? null;
        this.isErrorOutput = data.isErrorOutput ?? false;
        this.posY = (allPorts.length < 2) ? 10 : 4 + (12 * index);
        this.connections = data.connections;
        // this.wires = (data.connections)
        //     ? data.connections.map(c => new WireExecutionModel(c, this))
        //     : [];
    }

    updateWiresAndProperties() {
        this.wires.forEach(w => {
            w.name = this.name;
            w.posY = this.posY;
            w.type = this.type;
        });
    }

    destroyWire(wire) {
        const index = this.wires.indexOf(wire);
        if (index > -1) this.wires.splice(index, 1);
    }

    // connect(wire) {
    //     wire.destination = this.activity;
    //     const fullAddress = FlowAddress.buildAddress(null, this.activity.address, this.address)
    //     wire.destinationAddress = fullAddress;
    // }

    // createWire(status) {
    //     let wire = new WireViewModel(null, this);
    //     if (!!status) wire.status = {...status};
    //     this.wires.push(wire);
    //     return wire;
    // }
}

class WireExecutionModel {
    constructor(destAddress, io) {
        console.log("new wire constructor: " + io.address + ":" + io.activity.address )
        this.key = ++io.activity.flow.keySeed;
        this.address = "W" + this.key;
        this.io = io;
        this.posY = io.posY;
        this.name = io.name ?? "";
        this.source = io.activity;
        this.destination = null;
        this.sourceAddress = io.address;
        this.destinationAddress = destAddress;
    }

    destroyWire() {
        this.io?.destroyWire(this);
    }
}


exports.FlowExecutionModel = FlowExecutionModel;