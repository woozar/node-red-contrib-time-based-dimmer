import { Context } from './tools/context'
import { wait } from './tools/wait'

// eslint-disable-next-line import/no-unresolved
const oneButtonDimmer = require('./one-button-dimmer')

describe('time based dimmer', () => {
  const config = {
    step: 5 as any,
    minValue: 0,
    maxValue: 30,
    interval: 50,
    startCommand: 'long',
    stopCommand: 'long_release'
  }
  const types: { [name: string]: any } = {}
  const listeners: { [name: string]: Function[] } = {}
  let lastNode: any
  let currentStatus: {
    fill: string
    shape: string
    text: string
  }
  const registerListener = (name: string, fn: Function) => {
    if (!listeners[name]) {
      listeners[name] = []
    }
    listeners[name].push(fn)
  }
  const contextMock = new Context()
  const redMock = {
    nodes: {
      createNode: jest.fn((obj, conf) => {
        lastNode = obj
        lastNode.on = registerListener
        lastNode.context = () => contextMock
        lastNode.log = jest.fn()
        lastNode.status = jest.fn((o: any) => {
          currentStatus = o
        })
        expect(conf).toEqual(config)
      }),
      registerType: jest.fn((name, type) => {
        types[name] = type
      })
    }
  }

  beforeAll(() => {
    oneButtonDimmer(redMock as any)
  })

  it('registers a new type', () => {
    expect(types).toHaveProperty('one-button-dimmer')
  })

  describe('instance', () => {
    let currentVal: any
    let handleSend: Function

    beforeAll(() => {
      types['one-button-dimmer'](config)
    })

    async function sendPayload(payload: any): Promise<void> {
      return new Promise((resolve, reject) => {
        listeners.input[0]({ payload }, handleSend, (err: Error) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
    }

    beforeEach(async () => {
      handleSend = jest.fn((v: any) => {
        currentVal = v.payload
      })
      await sendPayload(15)
      expect(currentStatus).toEqual({
        fill: 'grey',
        shape: 'dot',
        text: '15'
      })
      contextMock.set('mode', '')
    })

    it('creates a new instance', () => {
      expect(lastNode).toBeDefined()
    })

    it('accepts a number as current value', () => {
      expect(currentVal).toEqual(15)
      expect(handleSend).toHaveBeenCalledTimes(1)
    })

    it('starts and stops the dimmer up', async () => {
      await sendPayload(config.startCommand)
      await wait(125)
      await sendPayload(config.stopCommand)
      expect(currentVal).toEqual(25)
      expect(currentStatus).toEqual({
        fill: 'grey',
        shape: 'dot',
        text: '25'
      })
      expect(handleSend).toHaveBeenCalledTimes(3)
      await wait(50)
      expect(currentVal).toEqual(25)
      expect(handleSend).toHaveBeenCalledTimes(3)
    })

    it('can handle the step property from the config as string', async () => {
      config.step = '7'
      try {
        await sendPayload(config.startCommand)
        await wait(75)
        await sendPayload(config.stopCommand)
        expect(currentVal).toEqual(22)
        expect(currentStatus).toEqual({
          fill: 'grey',
          shape: 'dot',
          text: '22'
        })
        expect(handleSend).toHaveBeenCalledTimes(2)
      } finally {
        config.step = 5
      }
    })

    it('starts and stops the dimmer down', async () => {
      await sendPayload(config.startCommand)
      await sendPayload(config.stopCommand)
      await sendPayload(config.startCommand)
      await wait(75)
      await sendPayload(config.stopCommand)
      expect(currentVal).toEqual(10)
      expect(currentStatus).toEqual({
        fill: 'grey',
        shape: 'dot',
        text: '10'
      })
      expect(handleSend).toHaveBeenCalledTimes(2)
    })

    it('reaches the upper limit', async () => {
      await sendPayload(config.startCommand)
      await wait(225)
      expect(currentVal).toEqual(30)
      expect(handleSend).toHaveBeenCalledTimes(4)
    })

    it('reaches the lower limit', async () => {
      await sendPayload(config.startCommand)
      await sendPayload(config.stopCommand)
      await sendPayload(config.startCommand)
      await wait(225)
      expect(currentVal).toEqual(0)
      expect(handleSend).toHaveBeenCalledTimes(4)
    })

    it('ignores unknown commands', async () => {
      await sendPayload('start')
      await wait(75)
      expect(currentVal).toEqual(15)
      expect(handleSend).toHaveBeenCalledTimes(1)
      expect(lastNode.log).toHaveBeenCalledTimes(1)
    })

    it('ignores duplicate start commands', async () => {
      await sendPayload(config.startCommand)
      await sendPayload(config.startCommand)
      await wait(75)
      expect(currentVal).toEqual(20)
      expect(handleSend).toHaveBeenCalledTimes(2)
      await sendPayload(config.stopCommand)
    })

    it('ignores duplicate stop commands', async () => {
      await sendPayload(config.startCommand)
      await wait(75)
      expect(currentVal).toEqual(20)
      expect(handleSend).toHaveBeenCalledTimes(2)
      await sendPayload(config.stopCommand)
      await sendPayload(config.stopCommand)
      expect(currentVal).toEqual(20)
      expect(handleSend).toHaveBeenCalledTimes(2)
    })

    it('is backwards compatible', async () => {
      listeners.input[0]({ payload: config.startCommand }, handleSend)
      await wait(75)
      await sendPayload(config.stopCommand)
      expect(currentVal).toEqual(20)
      expect(handleSend).toHaveBeenCalledTimes(2)
    })

    it('ignores unknown payloads', async () => {
      await sendPayload(true)
      await wait(75)
      await sendPayload(config.stopCommand)
      expect(currentVal).toEqual(15)
      expect(handleSend).toHaveBeenCalledTimes(1)
    })
  })
})
