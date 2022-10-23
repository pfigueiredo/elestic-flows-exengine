exports.Dictionary = class Dictionary {
    constructor() {
        this.store = {};
        this.length = 0;
    }

    add(key, value) {
        if (this.store.hasOwnProperty(key)) {
            this.store[key] = value;    
        } else {
            this.store[key] = value;
            this.length++;
        }
    }

    remove(key) {
        delete this.store[key];
        this.length--;
    }

    get(key) {
        if (this.containsKey(key))
            return this.store[key];
        else
            return null;
    }

    getKeys() {
        const keys = [];
        for (var key in this.store) {
            if (Object.prototype.hasOwnProperty.call(this.store, key)) {
                keys.push(key);
            }
        }
        return keys;
    }

    getValues() {
        const vals = [];
        for (var key in this.store) {
            if (Object.prototype.hasOwnProperty.call(this.store, key)) {
                vals.push(this.store[key]);
            }
        }
        return vals;
    }

    containsKey(key) {
        return this.store.hasOwnProperty(key);
    }
}
