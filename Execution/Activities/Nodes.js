const { assign } = require("./CoreActivities/Assign");
const { slice } = require("./CoreActivities/Slice");
const { glue } = require("./CoreActivities/Glue");
const { trigger } = require('./CoreActivities/TriggerOut');
const { userFx } = require('./CoreActivities/UserFx');
const { httpcall } = require('./CoreActivities/HttpCall');
const { call } = require('./CoreActivities/Call');
const { end } = require('./CoreActivities/End');
const { logNode } = require('./CoreActivities/LogNode');
const { ifNode } = require('./CoreActivities/IfNode');
const { switchNode } = require('./CoreActivities/switchNode')
const { fork } = require('./CoreActivities/Fork')

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
    description: "flow endpoint, end current branch and returns any messages back if in sync mode",
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

nodes["core:log"] = {
    isNode: true,
    icon: "n/fx.svg",
    name: "Log Execution",
    prepare: logNode.prepare,
    execute: logNode.execute,
    description: "log values to the execution console",
    inputs: [ { address: "I1", type: "sync" } ],
    outputs: [ { address: "O1", type: "sync" } ],
    properties: { }
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

nodes["core:if"] = {
    isNode: true,
    icon: "n/if.svg",
    name: "If/Else branch",
    prepare: ifNode.prepare,
    execute: ifNode.execute,
    description: "switches execution into several if/else paths",
    inputs: [ { address: "I1", type: "sync" } ],
    outputs: [ 
        { name: "true", address: "O1", type: "sync" },
        { name: "false", address: "O2", type: "sync" } 
    ]
}

nodes["core:fork"] = {
    isNode: true,
    icon: "n/if.svg",
    name: "Fork",
    prepare: fork.prepare,
    execute: fork.execute,
    description: "forks the execution into several paths",
    inputs: [ { address: "I1", type: "sync" } ],
    outputs: [ 
        { name: "Path 1", address: "O1", type: "sync" },
        { name: "Path 2", address: "O2", type: "sync" } 
    ],
    properties: {
        conditions: []
    }
}

nodes["core:switch"] = {
    isNode: true,
    icon: "n/if.svg",
    name: "Split/Switch",
    prepare: switchNode.prepare,
    execute: switchNode.execute,
    description: "switches the execution into several conditional paths",
    inputs: [ { address: "I1", type: "sync" } ],
    outputs: [ 
        { name: "Condition 1", address: "O1", type: "sync" },
        { name: "Condition 2", address: "O2", type: "sync" } 
    ],
    properties: {
        conditions: []
    }
}

nodes["core:join"] = {
    isNode: true,
    icon: "n/andJoin.svg",
    name: "Join",
    description: "joins executions from several branch and continues",
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