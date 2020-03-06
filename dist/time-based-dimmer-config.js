"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function fixBrokenConfig(config) {
    if (typeof config.interval === 'string')
        config.interval = Number.parseFloat(config.interval);
    if (typeof config.step === 'string')
        config.step = Number.parseFloat(config.step);
    if (typeof config.maxValue === 'string')
        config.maxValue = Number.parseFloat(config.maxValue);
    if (typeof config.minValue === 'string')
        config.minValue = Number.parseFloat(config.minValue);
}
exports.fixBrokenConfig = fixBrokenConfig;
