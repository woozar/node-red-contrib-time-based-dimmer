import { Context } from './tools/context'
import { wait } from './tools/wait'

// eslint-disable-next-line import/no-unresolved
const timeBasedDimmer = require('./time-based-dimmer')

describe('time based dimmer', () => {
  const types: { [name: string]: any } = {}
  let listeners: { [name: string]: Function[] } = {}
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
      createNode: jest.fn(obj => {
        lastNode = obj
        lastNode.on = registerListener
        lastNode.context = () => contextMock
        lastNode.log = jest.fn()
        lastNode.status = jest.fn((o: any) => {
          currentStatus = o
        })
      }),
      registerType: jest.fn((name, type) => {
        types[name] = type
      })
    }
  }

  beforeAll(() => {
    timeBasedDimmer(redMock as any)
  })

  it('registers a new type', () => {
    expect(types).toHaveProperty('time-based-dimmer')
  })

  describe('instance', () => {
    let currentVal: any
    let handleSend: Function

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

    describe('regular config', () => {
      const config = {
        step: 5 as any,
        minValue: 0,
        maxValue: 30,
        interval: 50,
        startIncCommand: 'brightness_up',
        stopIncCommand: 'brightness_stop',
        startDecCommand: 'brightness_down',
        stopDecCommand: 'brightness_stop'
      }

      beforeAll(() => {
        types['time-based-dimmer'](config)
      })

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
      })

      it('creates a new instance', () => {
        expect(lastNode).toBeDefined()
      })
      it('accepts a number as current value', () => {
        expect(currentVal).toEqual(15)
        expect(handleSend).toHaveBeenCalledTimes(1)
      })
      it('starts and stops the dimmer up', async () => {
        await sendPayload(config.startIncCommand)
        await wait(125)
        await sendPayload('brightness_stop')
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
      it('starts and stops the dimmer down', async () => {
        await sendPayload('brightness_down')
        await wait(75)
        await sendPayload('brightness_stop')
        expect(currentVal).toEqual(10)
        expect(currentStatus).toEqual({
          fill: 'grey',
          shape: 'dot',
          text: '10'
        })
        expect(handleSend).toHaveBeenCalledTimes(2)
      })
      it('reaches the upper limit', async () => {
        await sendPayload(config.startIncCommand)
        await wait(225)
        expect(currentVal).toEqual(30)
        expect(handleSend).toHaveBeenCalledTimes(4)
        await sendPayload(config.stopIncCommand)
        expect(currentVal).toEqual(30)
        expect(handleSend).toHaveBeenCalledTimes(4)
      })
      it('reaches the lower limit', async () => {
        await sendPayload(config.startDecCommand)
        await wait(225)
        expect(currentVal).toEqual(0)
        expect(handleSend).toHaveBeenCalledTimes(4)
        await sendPayload(config.stopDecCommand)
        expect(currentVal).toEqual(0)
        expect(handleSend).toHaveBeenCalledTimes(4)
      })
      it('ignores unknown commands', async () => {
        await sendPayload('bright_up')
        await wait(75)
        expect(currentVal).toEqual(15)
        expect(handleSend).toHaveBeenCalledTimes(1)
        expect(lastNode.log).toHaveBeenCalledTimes(1)
      })
      it('ignores duplicate start Inc commands', async () => {
        await sendPayload(config.startIncCommand)
        await sendPayload(config.startIncCommand)
        await wait(75)
        expect(currentVal).toEqual(20)
        expect(handleSend).toHaveBeenCalledTimes(2)
        await sendPayload(config.stopIncCommand)
      })
      it('ignores duplicate start Dec commands', async () => {
        await sendPayload(config.startDecCommand)
        await sendPayload(config.startDecCommand)
        await wait(75)
        expect(currentVal).toEqual(10)
        expect(handleSend).toHaveBeenCalledTimes(2)
        await sendPayload(config.stopDecCommand)
      })
      it('ignores duplicate start mixed commands', async () => {
        await sendPayload(config.startDecCommand)
        await sendPayload(config.startIncCommand)
        await wait(75)
        expect(currentVal).toEqual(10)
        expect(handleSend).toHaveBeenCalledTimes(2)
        await sendPayload(config.stopDecCommand)
      })
      it('ignores duplicate stop commands', async () => {
        await sendPayload(config.startDecCommand)
        await wait(75)
        expect(currentVal).toEqual(10)
        expect(handleSend).toHaveBeenCalledTimes(2)
        await sendPayload(config.stopDecCommand)
        await sendPayload(config.stopDecCommand)
        expect(currentVal).toEqual(10)
        expect(handleSend).toHaveBeenCalledTimes(2)
      })
      it('is backwards compatible', async () => {
        listeners.input[0]({ payload: config.startDecCommand }, handleSend)
        await wait(75)
        await sendPayload(config.stopDecCommand)
        expect(currentVal).toEqual(10)
        expect(handleSend).toHaveBeenCalledTimes(2)
      })
      it('ignores unknown payloads', async () => {
        await sendPayload(true)
        await wait(75)
        expect(currentVal).toEqual(15)
        expect(handleSend).toHaveBeenCalledTimes(1)
      })
    })

    describe('strange config', () => {
      const strangeConfig = {
        step: '7',
        minValue: '0',
        maxValue: '30',
        interval: '50',
        startIncCommand: 'brightness_up',
        stopIncCommand: 'brightness_stop',
        startDecCommand: 'brightness_down',
        stopDecCommand: 'brightness_stop'
      }

      beforeAll(() => {
        listeners = {}
        types['time-based-dimmer'](strangeConfig)
      })

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
      })

      it('can handle the properties from the config as strings', async () => {
        types['time-based-dimmer'](strangeConfig)

        expect(typeof strangeConfig.interval).toEqual('number')
        expect(typeof strangeConfig.step).toEqual('number')
        expect(typeof strangeConfig.minValue).toEqual('number')
        expect(typeof strangeConfig.maxValue).toEqual('number')

        await sendPayload(strangeConfig.startIncCommand)
        await wait(75)
        await sendPayload('brightness_stop')
        expect(currentVal).toEqual(22)
        expect(currentStatus).toEqual({
          fill: 'grey',
          shape: 'dot',
          text: '22'
        })
        expect(handleSend).toHaveBeenCalledTimes(2)
      })
    })
  })
})
