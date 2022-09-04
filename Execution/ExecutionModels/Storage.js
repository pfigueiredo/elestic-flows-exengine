const { getValue, setValue } = require('./StorageDb');

class Storage {
    constructor(name, typeKey) {
        this.name = name;
        this.typeKey = typeKey;
    }

    composeKey(key, typeKey) {
        return `${key}#${typeKey}`;
    }

    setValue(key, value) { 
        const cKey = this.composeKey(key, this.typeKey);
        return setValue(key, value)
    }

    getValue(key) { 
        const cKey = this.composeKey(key, this.typeKey);
        return getValue(key)
    }

}

exports.Storage = Storage;