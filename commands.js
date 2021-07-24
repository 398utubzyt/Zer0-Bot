'use strict';

class Command {
    constructor(name, alias, method) {
        this.name = name;
        this.aliases = alias;
        this.method = method;
    }
}

class CommandUtil {
    static get Prefix() {
        return ':';
    }

    static StringToCommand(msgContent) {
        if (typeof(msgContent) != String)
            throw 'Message content is not a string.';
    }
}