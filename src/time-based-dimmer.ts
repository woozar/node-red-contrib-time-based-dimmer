// eslint-disable-next-line import/no-unresolved, no-unused-vars
import { Red, Node, NodeProperties } from 'node-red'

interface TimeBasedDimmerConfig extends NodeProperties {
  interval: number
  step: number
  maxValue: number
  minValue: number
  startIncCommand: string
  startDecCommand: string
  stopIncCommand: string
  stopDecCommand: string
}

module.exports = (red: Red): void => {
  function tick(send: Function, node: Node, config: TimeBasedDimmerConfig) {
    let newValue: number
    const step = typeof config.step === 'string' ? parseInt(config.step, 10) : config.step
    const oldValue = node.context().get('value') || 0
    if (node.context().get('mode') === 'inc') {
      newValue = oldValue + step
      if (newValue > config.maxValue) {
        clearInterval(node.context().get('timer'))
        node.context().set('timer', null)
        newValue = config.maxValue
      }
    } else {
      newValue = oldValue - step
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
    constructor(config: TimeBasedDimmerConfig) {
      red.nodes.createNode(this as any, config)
      const node: Node = this as any
      node.on('input', (msg: any, send: Function, done: Function) => {
        let timer
        switch (typeof msg.payload) {
          case 'number':
            node.status({ fill: 'grey', shape: 'dot', text: msg.payload.toString() })
            node.context().set('value', msg.payload)
            send(msg)
            break
          case 'string':
            timer = node.context().get('timer')
            switch (msg.payload) {
              case config.startIncCommand:
                if (timer) break
                node.context().set('mode', 'inc')
                node.context().set(
                  'timer',
                  setInterval(() => tick(send, node, config), config.interval)
                )
                break
              case config.startDecCommand:
                if (timer) break
                node.context().set('mode', 'dec')
                node.context().set(
                  'timer',
                  setInterval(() => tick(send, node, config), config.interval)
                )
                break
              case config.stopIncCommand:
              case config.stopDecCommand:
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

  red.nodes.registerType('time-based-dimmer', TimeBasedDimmerNode as any)
}
