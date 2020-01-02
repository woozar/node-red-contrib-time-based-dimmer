// eslint-disable-next-line no-unused-vars
import { NodeProperties } from 'node-red'

export interface TimeBasedDimmerConfig extends NodeProperties {
  interval: number
  step: number
  maxValue: number
  minValue: number
}

export function fixBrokenConfig(config: TimeBasedDimmerConfig): void {
  /* eslint-disable no-param-reassign */
  if (typeof config.interval === 'string') config.interval = Number.parseFloat(config.interval)
  if (typeof config.step === 'string') config.step = Number.parseFloat(config.step)
  if (typeof config.maxValue === 'string') config.maxValue = Number.parseFloat(config.maxValue)
  if (typeof config.minValue === 'string') config.minValue = Number.parseFloat(config.minValue)
  /* eslint-enable no-param-reassign */
}
