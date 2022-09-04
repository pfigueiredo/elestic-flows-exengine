
let FlowAddress = {};
const regex = /(F[0-9]+)?(A[0-9]+)?((I[0-9]+)|(O[0-9]+))?/;

function compareTokens (t1, t2) {
    if (((t1 ?? "") === "") || ((t2 ?? "") === ""))
        return true;
    else
        return t1 === t2;
}

function strictlyCompareTokens (t1, t2) {
    return (t1 ?? "") === (t2 ?? "");
}

FlowAddress.SameActivity = function(str1, str2) {
    var a1 = FlowAddress.getAddressParts(str1);
    var a2 = FlowAddress.getAddressParts(str2);
    
    return compareTokens(a1.flow, a2.flow)
        && strictlyCompareTokens(a1.activity, a2.activity);
}

FlowAddress.SameFlow = function(str1, str2) {
    var a1 = FlowAddress.getAddressParts(str1);
    var a2 = FlowAddress.getAddressParts(str2);
    
    return strictlyCompareTokens(a1.flow, a2.flow);
}

FlowAddress.Equals = function (str1, str2) {
    var a1 = FlowAddress.getAddressParts(str1);
    var a2 = FlowAddress.getAddressParts(str2);
    
    return compareTokens(a1.flow, a2.flow)
        && strictlyCompareTokens(a1.activity, a2.activity)
        && strictlyCompareTokens(a1.output, a2.output)
        && strictlyCompareTokens(a1.input, a2.input)
}

FlowAddress.isAddress = function (str) {
    return (regex.exec(str)) !== null;
}

FlowAddress.buildAddress = function(flow, activity, io) {
    const aFlow = this.getAddressParts(flow);
    const aActivity = this.getAddressParts(activity);
    const aIO = this.getAddressParts(io);
    return (aFlow?.flow ?? "") + (aActivity?.activity ?? "") + (aIO?.io ?? "");
}

FlowAddress.GetActivity = function(str, currentActivity) {
    return this.getAddressParts(str)?.activity ?? currentActivity ?? null;
}

FlowAddress.GetFlow = function(str, currentFlow) {
    return this.getAddressParts(str)?.flow ?? currentFlow ?? null;
}

FlowAddress.GetIO = function(str) {
    let parts = this.getAddressParts(str);
    return parts.output ?? parts.input ?? null;
}

FlowAddress.isInput = function(str) {
    return (this.getAddressParts(str).input ?? "") !== "";
}

FlowAddress.isOutput = function(str) {
    return (this.getAddressParts(str).output ?? "") !== "";
}

FlowAddress.isOI = function(str) {
    let parts = this.getAddressParts(str);
    return ((parts.output ?? "") !== "")
        || ((parts.input ?? "") !== "")

}

FlowAddress.getAddressParts = function(str) {
    let m;
    if (!!str && (m = regex.exec(str)) !== null) {
        var obj = {};

        obj.flow = m[1] ?? null;
        obj.activity = m[2] ?? null;
        obj.output = m[4] ?? null;
        obj.input = m[5] ?? null;
        obj.io = m[4] ?? m[5] ?? null;

        return obj;
    }
    return null;
}

exports.FlowAddress = FlowAddress;