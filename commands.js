'use strict';

class Command {
    constructor(name, alias, method) {
        this.name = name;
        this.aliases = alias;
        this.method = method;
    }
}