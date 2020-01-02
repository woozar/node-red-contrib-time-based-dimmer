// eslint-disable-next-line import/no-unresolved, no-unused-vars
import { Red, Node } from 'node-red'
// eslint-disable-next-line no-unused-vars
import { TimeBasedDimmerConfig } from './time-based-dimmer-config'

interface OneButtonDimmerConfig extends TimeBasedDimmerConfig {
  startCommand: string
  stopCommand: string
}

module.exports = (red: Red): void => {
  function tick(send: Function, node: Node, config: OneButtonDimmerConfig) {
    let newValue: number
    const oldValue = node.context().get('value') || 0
    if (node.context().get('mode') === 'inc') {
      newValue = oldValue + config.step
      if (newValue > config.maxValue) {
        clearInterval(node.context().get('timer'))
        node.context().set('timer', null)
        newValue = config.maxValue
      }
    } else {
      newValue = oldValue - config.step
      if (newValue < config.minValue) {
        clearInterval(node.context().get('timer'))
        node.context().set('timer', null)
        newValue = config.minValue
      }
    }
    if (node.context().get('value') === newValue) return
    node.status({ fill: 'grey', shape: 'dot', text: newValue.toString() })
    node.context().set('value', newValue)
    send({ payload: newValue })
  }

  class TimeBasedDimmerNode {
    constructor(config: OneButtonDimmerConfig) {
      red.nodes.createNode(this as any, config)
      const node: Node = this as any
      node.on('input', (msg: any, send: Function, done: Function) => {
        let timer
        let currentMode
        switch (typeof msg.payload) {
          case 'number':
            node.status({ fill: 'grey', shape: 'dot', text: msg.payload.toString() })
            node.context().set('value', msg.payload)
            send(msg)
            break
          case 'string':
            timer = node.context().get('timer')
            switch (msg.payload) {
              case config.startCommand:
                if (timer) break
                currentMode = node.context().get('mode')
                node.context().set('mode', currentMode === 'inc' ? 'dec' : 'inc')
                node.context().set(
                  'timer',
                  setInterval(() => tick(send, node, config), config.interval)
                )
                break
              case config.stopCommand:
                if (!timer) break
                clearInterval(timer)
                node.context().set('timer', null)
                break
              default:
                node.log(`missing command "${msg.payload}"`)
            }
            break
          default:
          // do nothing
        }
        if (done) {
          done()
        }
      })
    }
  }

  red.nodes.registerType('one-button-dimmer', TimeBasedDimmerNode as any)
}
