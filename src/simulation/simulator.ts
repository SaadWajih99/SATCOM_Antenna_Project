import { cloneConfig, cloneState, defaultSimulationConfig, delayedMeasurement, initialSimulationState, SimulationConfig, SimulationState } from './types'
import { stepAxis } from './plant'

export class AntennaSimulator {
  readonly config: SimulationConfig
  state: SimulationState
  private azDelay: number[] = []
  private elDelay: number[] = []

  constructor(config: SimulationConfig = defaultSimulationConfig()) {
    this.config = cloneConfig(config)
    this.state = initialSimulationState(this.config)
  }

  reset() {
    this.state = initialSimulationState(this.config)
    this.azDelay = []
    this.elDelay = []
  }

  update(dt: number) {
    const safeDt = Math.min(Math.max(dt, 0.001), 0.1)
    const { config, state } = this
    const time = state.time + safeDt
    const azFeedback = delayedMeasurement(this.azDelay, state.az.measuredEncoder, config.feedbackDelay, safeDt)
    const elFeedback = delayedMeasurement(this.elDelay, state.el.measuredEncoder, config.feedbackDelay, safeDt)
    const az = stepAxis(state.az, state.targetAz, config.az, safeDt, time, azFeedback, config.disturbanceTorque)
    const el = stepAxis(state.el, state.targetEl, config.el, safeDt, time, elFeedback, config.disturbanceTorque)
    const blocked = config.emergencyStop || config.watchdogTimeout || az.encoderStatus === 'FAILED' || el.encoderStatus === 'FAILED'
    if (blocked) { az.command = 0; el.command = 0 }
    const encoderFault = az.encoderStatus !== 'VALID' || el.encoderStatus !== 'VALID'
    const error = Math.hypot(az.error, el.error)
    const safety = config.emergencyStop || config.watchdogTimeout ? 'SAFE' : encoderFault ? 'FAULT' : error > 20 ? 'DEGRADED' : error > 8 ? 'WARNING' : 'NORMAL'
    const watchdog = config.watchdogTimeout ? 'TIMEOUT' : 'NOMINAL'
    const event = state.safety !== safety ? `${safety} STATE ENTERED` : ''
    const history = [...state.history, { time, targetAz: state.targetAz, actualAz: az.position, targetEl: state.targetEl, actualEl: el.position, azError: az.error, elError: el.error, commandAz: az.command, commandEl: el.command }].slice(-600)
    this.state = { ...state, time, az, el, safety, watchdog, history, events: event ? [event, ...state.events].slice(0, 20) : state.events }
    return this.state
  }

  setTargets(az: number, el: number) { this.state.targetAz = az; this.state.targetEl = el }
  snapshot() { return cloneState(this.state) }
}
