const { assign } = require("./CoreActivities/Assign");
const { slice } = require("./CoreActivities/Slice");
const { glue } = require("./CoreActivities/Glue");
const { trigger } = require('./CoreActivities/TriggerOut');
const { userFx } = require('./CoreActivities/UserFx');
const { httpcall } = require('./CoreActivities/HttpCall');
const { call } = require('./CoreActivities/Call');
const { end } = require('./CoreActivities/End')

const nodes = {};

nodes["core:start"] = {
    isNode: true,
    icon: "n/triggerIn.svg",
    name: "Start",
    inputs: [],
    description: "starts a flow from an external trigger",
    outputs: [ { address: "O1", type: "sync" } ],
    properties: { }
}

nodes["core:end"] = {
    isNode: true,
    icon: "n/triggerOut.svg",
    name: "Start",
    inputs: [],
    repare: end.prepare,
    execute: end.execute,
    description: "flow endpoint, returns any messages back if in sync mode",
    outputs: [ ],
    properties: { }
}

nodes["core:function"] = {
    isNode: true,
    icon: "n/fx.svg",
    name: "Function",
    prepare: userFx.prepare,
    execute: userFx.execute,
    description: "a user defined node/activity coded in javascript",
    inputs: [ { address: "I1", type: "sync" } ],
    outputs: [ { address: "O1", type: "sync" } ],
    properties: {
        functionCode: `//The default function only relays the current msg to the next activity\nContinueWith(msg);`
    }
}

nodes["core:catch"] = {
    isNode: true,
    icon: "n/fx.svg",
    name: "Catch Error",
    description: "catch an error thown in the current flow in the same process",
    inputs: [],
    outputs: [ { address: "O1", type: "sync" } ],
    properties: { }
}

nodes["core:assign"] = {
    isNode: true,
    icon: "n/assign.svg",
    name: "Assign",
    prepare: assign.prepare,
    execute: assign.execute,
    description: "assigns a variable(s) to values",
    inputs: [ { address: "I1", type: "sync" } ],
    outputs: [ { address: "O1", type: "sync" } ]
}

nodes["core:switch"] = {
    isNode: true,
    icon: "n/if.svg",
    name: "Split/Switch",
    description: "switches the execution into several conditional paths",
    inputs: [ { address: "I1", type: "sync" } ],
    outputs: [ 
        { name: "true", address: "O1", type: "sync" },
        { name: "false", address: "O2", type: "sync" } 
    ]
}

nodes["core:join"] = {
    isNode: true,
    icon: "n/andJoin.svg",
    name: "Join",
    description: "joins executions from several inputs and continues",
    inputs: [ { address: "I1", type: "sync" } ],
    outputs: [ { address: "O1", type: "sync" } ]
}

nodes["core:glue"] = {
    isNode: true,
    icon: "n/glue.svg",
    name: "Glue",
    prepare: glue.prepare,
    execute: glue.execute,
    description: "joins a set of messages into a single 'array' message",
    inputs: [ { address: "I1", type: "sync" } ],
    outputs: [ { address: "O1", type: "sync" } ]
}

nodes["core:call"] = {
    isNode: true,
    icon: "n/call.svg",
    name: "Call",
    prepare: call.prepare,
    execute: call.execute,
    description: "calls a subflow and continues after the subflow execussion",
    inputs: [ { address: "I1", type: "sync" } ],
    outputs: [ { address: "O1", type: "sync" } ]
}

nodes["core:slice"] = {
    isNode: true,
    icon: "n/slice.svg",
    name: "Slice",
    prepare: slice.prepare,
    execute: slice.execute,
    description: "splis an array message into several messages",
    inputs: [ { address: "I1", type: "sync" } ],
    outputs: [ { address: "O1", type: "sync" } ]
}

nodes["core:transform"] = {
    isNode: true,
    icon: "n/transform.svg",
    name: "Transform",
    description: "performs a transformation on a message payload",
    inputs: [ { address: "I1", type: "sync" } ],
    outputs: [ { address: "O1", type: "sync" } ]
}

nodes["core:trigger"] = {
    isNode: true,
    icon: "n/triggerOut.svg",
    name: "Trigger",
    prepare: trigger.prepare,
    execute: trigger.execute,
    description: "triggers the execussion of a new flow and continues",
    inputs: [ { address: "I1", type: "sync" } ],
    outputs: [ { address: "O1", type: "sync" } ]
}

nodes["http:call"] = {
    isNode: true,
    icon: "n/call.svg",
    name: "Http call",
    prepare: httpcall.prepare,
    execute: httpcall.execute,
    description: "does an external http rest call",
    inputs: [ { address: "I1", type: "sync" } ],
    outputs: [ { address: "O1", type: "sync" } ]
}

nodes["list:operation"] = {
    isNode: true,
    icon: "n/call.svg",
    name: "Http call",
    prepare: httpcall.prepare,
    execute: httpcall.execute,
    description: "does an external http rest call",
    inputs: [ { address: "I1", type: "sync" } ],
    outputs: [ { address: "O1", type: "sync" } ]
}

nodes["object:operation"] = {
    isNode: true,
    icon: "n/call.svg",
    name: "Http call",
    prepare: httpcall.prepare,
    execute: httpcall.execute,
    description: "does an external http rest call",
    inputs: [ { address: "I1", type: "sync" } ],
    outputs: [ { address: "O1", type: "sync" } ]
}

nodes.fillInDefautls = function(node) {
    if (node?.type) {
        let prototype = nodes[node.type];
        if (!node.properties) node.properties = {};
        if (prototype.properties) {
            for (var key in prototype.properties) {
                if (!node.properties[key])
                    node.properties[key] = prototype.properties[key];
            }
        }
    }
}

exports.nodes = nodes;