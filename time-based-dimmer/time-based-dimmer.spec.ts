import timeBasedDimmer from './time-based-dimmer'

const wait = (delay: number): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(resolve, delay);
  })
}

class Context {
  values: { [key: string]: any } = {}
  get(key: string): any {
    return this.values[key]
  }
  set(key: string, value: any): void {
    this.values[key] = value
  }
}

describe('time based dimmer', () => {
  const config = {
    step: 5,
    minValue: 0,
    maxValue: 30,
    interval: 50,
    startIncCommand: 'brightness_up',
    stopIncCommand: 'brightness_stop',
    startDecCommand: 'brightness_down',
    stopDecCommand: 'brightness_stop'
  }
  const types: { [name: string]: any } = {}
  const listeners: { [name: string]: Function[] } = {}
  let lastNode: any
  let currentStatus: {
    fill: string,
    shape: string,
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
        lastNode = obj;
        obj.on = registerListener
        obj.context = () => contextMock
        obj.warn = jest.fn()
        obj.status = jest.fn((obj) => {
          currentStatus = obj
        })
        expect(conf).toEqual(config)
      }),
      registerType: jest.fn((name, type) => {
        types[name] = type
      })
    }
  }

  beforeAll(() => {
    timeBasedDimmer(redMock)
  })

  it('registers a new type', () => {
    expect(types).toHaveProperty('time-based-dimmer')
  })

  describe('instance', () => {
    let currentVal: any
    let handleSend: Function
  
    beforeAll(() => {
      types['time-based-dimmer'](config)
    })

    async function sendPayload(payload: any): Promise<void> {
      return new Promise((resolve, reject) => {
        listeners['input'][0]({ payload }, handleSend, (err: Error) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
    }


    beforeEach(async () => {
      handleSend = jest.fn((v: any) => { currentVal = v.payload })
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
      expect(currentVal).toEqual(15);
      expect(handleSend).toHaveBeenCalledTimes(1)
    })

    it('starts and stops the dimmer up', async () => {
      await sendPayload('brightness_up');
      await wait(125)
      await sendPayload('brightness_stop');
      expect(currentVal).toEqual(25);
      expect(currentStatus).toEqual({
        fill: 'grey',
        shape: 'dot',
        text: '25'
      })
      expect(handleSend).toHaveBeenCalledTimes(3)
      await wait(50)
      expect(currentVal).toEqual(25);
      expect(handleSend).toHaveBeenCalledTimes(3)
    })

    it('starts and stops the dimmer down', async () => {
      await sendPayload('brightness_down');
      await wait(75)
      await sendPayload('brightness_stop');
      expect(currentVal).toEqual(10);
      expect(currentStatus).toEqual({
        fill: 'grey',
        shape: 'dot',
        text: '10'
      })
      expect(handleSend).toHaveBeenCalledTimes(2)
    })

    it('reaches the upper limit', async () => {
      await sendPayload('brightness_up');
      await wait(225)
      expect(currentVal).toEqual(30);
      expect(handleSend).toHaveBeenCalledTimes(4)
      await sendPayload('brightness_stop');
      expect(currentVal).toEqual(30);
      expect(handleSend).toHaveBeenCalledTimes(4)
    })

    it('reaches the lower limit', async () => {
      await sendPayload('brightness_down');
      await wait(225)
      expect(currentVal).toEqual(0);
      expect(handleSend).toHaveBeenCalledTimes(4)
      await sendPayload('brightness_stop');
      expect(currentVal).toEqual(0);
      expect(handleSend).toHaveBeenCalledTimes(4)
    })

    it('ignores unknown commands', async () => {
      await sendPayload('bright_up');
      await wait(75)
      expect(currentVal).toEqual(15);
      expect(handleSend).toHaveBeenCalledTimes(1)
      expect(lastNode.warn).toHaveBeenCalledTimes(1)
    })

    it('ignores duplicate start Inc commands', async () => {
      await sendPayload('brightness_up');
      await sendPayload('brightness_up');
      await wait(75)
      expect(currentVal).toEqual(20);
      expect(handleSend).toHaveBeenCalledTimes(2)
      await sendPayload('brightness_stop');
    })

    it('ignores duplicate start Dec commands', async () => {
      await sendPayload('brightness_down');
      await sendPayload('brightness_down');
      await wait(75)
      expect(currentVal).toEqual(10);
      expect(handleSend).toHaveBeenCalledTimes(2)
      await sendPayload('brightness_stop');
    })

    it('ignores duplicate start mixed commands', async () => {
      await sendPayload('brightness_down');
      await sendPayload('brightness_up');
      await wait(75)
      expect(currentVal).toEqual(10);
      expect(handleSend).toHaveBeenCalledTimes(2)
      await sendPayload('brightness_stop');
    })

    it('ignores duplicate stop commands', async () => {
      await sendPayload('brightness_down');
      await wait(75)
      expect(currentVal).toEqual(10);
      expect(handleSend).toHaveBeenCalledTimes(2)
      await sendPayload('brightness_stop');
      await sendPayload('brightness_stop');
      expect(currentVal).toEqual(10);
      expect(handleSend).toHaveBeenCalledTimes(2)
    })

    it('is backwards compatible', async () => {
      listeners['input'][0]({ payload: 'brightness_down' }, handleSend)
      await wait(75)
      await sendPayload('brightness_stop');
      expect(currentVal).toEqual(10);
      expect(handleSend).toHaveBeenCalledTimes(2)
    })

    it('ignores unknown payloads', async () => {
      await sendPayload(true);
      await wait(75)
      await sendPayload('brightness_stop');
      expect(currentVal).toEqual(15);
      expect(handleSend).toHaveBeenCalledTimes(1)
    })
  })
})