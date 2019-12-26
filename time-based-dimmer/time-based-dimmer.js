module.exports = function(RED) {
  function TimeBasedDimmerNode(config) {
    function tick(send, node) {
      let newValue
      const oldValue = node.context().get('value') || 0
      if (node.context().get('mode') === 'inc') {
        newValue = oldValue + config.step
        if (newValue > config.maxValue) {
          clearInterval(node.context().get('timer'));
          node.context().set('timer', null)
          newValue = config.maxValue;
        }
      } else {
        newValue = oldValue - config.step
        if (newValue < config.minValue) {
          clearInterval(node.context().get('timer'));
          node.context().set('timer', null)
          newValue = config.minValue;
        }
      }
      if (node.context().get('value') === newValue) return
      node.status({ fill:"grey", shape:"dot", text: newValue.toString() });
      node.context().set('value', newValue)
      send({ payload: newValue })
    }
    
    RED.nodes.createNode(this, config);
    var node = this;
    node.on('input', (msg, send, done) => {
      switch(typeof msg.payload) {
        case 'number':
          node.status({ fill:"grey", shape:"dot", text: msg.payload.toString() });
          node.context().set('value', msg.payload)
          send(msg)
        break
        case 'string':
          const timer = node.context().get('timer');
          switch(msg.payload) {
            case config.startIncCommand:
              if (timer) break
              node.context().set('mode', 'inc')
              node.context().set('timer', setInterval(() => tick(send, node), config.interval));
            break
            case config.startDecCommand:
              if (timer) break
              node.context().set('mode', 'dec')
              node.context().set('timer', setInterval(() => tick(send, node), config.interval));
            break
            case config.stopIncCommand:
            case config.stopDecCommand:
              if (!timer) break
              clearInterval(timer);
              node.context().set('timer', null)
            break
            default:
              node.warn(`missing command "${msg.payload}"`)
          }
        break
        default:
          // do nothing
      }
      if (done) {
        done()
      }
    });
  }
  RED.nodes.registerType("time-based-dimmer", TimeBasedDimmerNode);
}