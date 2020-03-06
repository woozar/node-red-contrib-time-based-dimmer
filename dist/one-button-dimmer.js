"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = function (red) {
    function tick(send, node, config) {
        var newValue;
        var oldValue = node.context().get('value') || 0;
        if (node.context().get('mode') === 'inc') {
            newValue = oldValue + config.step;
            if (newValue > config.maxValue) {
                clearInterval(node.context().get('timer'));
                node.context().set('timer', null);
                newValue = config.maxValue;
            }
        }
        else {
            newValue = oldValue - config.step;
            if (newValue < config.minValue) {
                clearInterval(node.context().get('timer'));
                node.context().set('timer', null);
                newValue = config.minValue;
            }
        }
        if (node.context().get('value') === newValue)
            return;
        node.status({ fill: 'grey', shape: 'dot', text: newValue.toString() });
        node.context().set('value', newValue);
        send({ payload: newValue });
    }
    var TimeBasedDimmerNode = (function () {
        function TimeBasedDimmerNode(config) {
            red.nodes.createNode(this, config);
            var node = this;
            node.on('input', function (msg, send, done) {
                var timer;
                var currentMode;
                switch (typeof msg.payload) {
                    case 'number':
                        node.status({ fill: 'grey', shape: 'dot', text: msg.payload.toString() });
                        node.context().set('value', msg.payload);
                        send(msg);
                        break;
                    case 'string':
                        timer = node.context().get('timer');
                        switch (msg.payload) {
                            case config.startCommand:
                                if (timer)
                                    break;
                                currentMode = node.context().get('mode');
                                node.context().set('mode', currentMode === 'inc' ? 'dec' : 'inc');
                                node.context().set('timer', setInterval(function () { return tick(send, node, config); }, config.interval));
                                break;
                            case config.stopCommand:
                                if (!timer)
                                    break;
                                clearInterval(timer);
                                node.context().set('timer', null);
                                break;
                            default:
                                node.log("missing command \"" + msg.payload + "\"");
                        }
                        break;
                    default:
                }
                if (done) {
                    done();
                }
            });
        }
        return TimeBasedDimmerNode;
    }());
    red.nodes.registerType('one-button-dimmer', TimeBasedDimmerNode);
};
