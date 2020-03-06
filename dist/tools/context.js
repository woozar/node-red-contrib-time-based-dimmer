"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Context = (function () {
    function Context() {
        this.values = {};
    }
    Context.prototype.get = function (key) {
        return this.values[key];
    };
    Context.prototype.set = function (key, value) {
        this.values[key] = value;
    };
    return Context;
}());
exports.Context = Context;
