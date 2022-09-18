const { getValue, setValue } = require('./StorageDb');

class Storage {
    constructor(name, typeKey) {
        this.name = name;
        this.typeKey = typeKey;
    }

    composeKey(key, typeKey) {
        return `${typeKey}#${key}`;
    }

    async setValue(key, value) { 
        const cKey = this.composeKey(key, this.typeKey);
        return await setValue(cKey, value)
    }

    async getValue(key) { 
        const cKey = this.composeKey(key, this.typeKey);
        return await getValue(cKey)
    }

}

exports.Storage = Storage;