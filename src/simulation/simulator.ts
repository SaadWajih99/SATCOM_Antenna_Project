import { cloneConfig, cloneState, defaultSimulationConfig, delayedMeasurement, initialSimulationState, SimulationConfig, SimulationMetrics, SimulationState } from './types'
import { stepAxis } from './plant'

function calculateMetrics(history: SimulationState['history']): SimulationMetrics {
  if (!history.length) return { rmsError: 0, maximumError: 0, maximumControlEffort: 0, steadyStateError: 0, riseTime: null, overshoot: 0, settlingTime: null }
  const errors = history.map((p) => Math.hypot(p.azError, p.elError))
  const rmsError = Math.sqrt(errors.reduce((sum, error) => sum + error ** 2, 0) / errors.length)
  const maximumError = Math.max(...errors)
  const maximumControlEffort = Math.max(...history.map((p) => Math.max(Math.abs(p.commandAz), Math.abs(p.commandEl))))
  const tail = errors.slice(-Math.min(25, errors.length))
  const steadyStateError = tail.reduce((sum, error) => sum + error, 0) / tail.length
  const initial = errors[0]
  const threshold = Math.max(initial * 0.1, 1)
  const riseIndex = errors.findIndex((error) => error <= initial * 0.1)
  const settlingIndex = errors.findIndex((_, index) => errors.slice(index).every((error) => error <= threshold))
  return { rmsError, maximumError, maximumControlEffort, steadyStateError, riseTime: riseIndex >= 0 ? history[riseIndex].time : null, overshoot: Math.max(0, maximumError - initial), settlingTime: settlingIndex >= 0 ? history[settlingIndex].time : null }
}

export class AntennaSimulator {
  readonly config: SimulationConfig
  state: SimulationState
  private azDelay: number[] = []
  private elDelay: number[] = []
  constructor(config: SimulationConfig = defaultSimulationConfig()) { this.config = cloneConfig(config); this.state = initialSimulationState(this.config) }
  reset() { this.state = initialSimulationState(this.config); this.azDelay = []; this.elDelay = [] }
  update(dt: number) {
    const safeDt = Math.min(Math.max(dt, 0.001), 0.1)
    const { config, state } = this
    const time = state.time + safeDt
    const azFeedback = delayedMeasurement(this.azDelay, state.az.measuredEncoder, config.feedbackDelay, safeDt)
    const elFeedback = delayedMeasurement(this.elDelay, state.el.measuredEncoder, config.feedbackDelay, safeDt)
    const az = stepAxis(state.az, state.targetAz, config.az, safeDt, time, azFeedback, config.disturbanceTorque)
    const el = stepAxis(state.el, state.targetEl, config.el, safeDt, time, elFeedback, config.disturbanceTorque)
    const blocked = config.emergencyStop || config.watchdogTimeout || az.encoderStatus === 'FAILED' || el.encoderStatus === 'FAILED'
    if (blocked) { az.command = 0; el.command = 0; az.torque = 0; el.torque = 0 }
    const encoderFault = az.encoderStatus === 'FAILED' || el.encoderStatus === 'FAILED'
    const error = Math.hypot(az.error, el.error)
    const safety = config.emergencyStop || config.watchdogTimeout ? 'SAFE' : encoderFault ? 'FAULT' : error > 20 ? 'DEGRADED' : error > 8 ? 'WARNING' : 'NORMAL'
    const watchdog = config.watchdogTimeout ? 'TIMEOUT' : 'NOMINAL'
    const history = [...state.history, { time, targetAz: state.targetAz, actualAz: az.position, targetEl: state.targetEl, actualEl: el.position, azError: az.error, elError: el.error, commandAz: az.command, commandEl: el.command }].slice(-600)
    const event = state.safety !== safety ? `${safety} STATE ENTERED` : ''
    this.state = { ...state, time, az, el, safety, watchdog, metrics: calculateMetrics(history), history, events: event ? [event, ...state.events].slice(0, 20) : state.events }
    return this.state
  }
  setTargets(az: number, el: number) { this.state.targetAz = az; this.state.targetEl = el }
  snapshot() { return cloneState(this.state) }
}

export { calculateMetrics }
