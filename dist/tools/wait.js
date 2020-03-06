"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function wait(delay) {
    return new Promise(function (resolve) { return setTimeout(resolve, delay); });
}
exports.wait = wait;
