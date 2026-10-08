export type AxisName = 'AZ' | 'EL'
export type EncoderStatus = 'VALID' | 'DROPOUT' | 'FAILED'

export interface PIDConfig { kp: number; ki: number; kd: number; outputLimit: number; integralLimit: number; derivativeFilter: number }
export interface PIDState { integral: number; previousError: number; derivative: number }
export interface PIDTerms { p: number; i: number; d: number; output: number; saturated: boolean }
export interface EncoderConfig { resolution: number; noise: number; offset: number; samplePeriod: number; failed: boolean; dropout: boolean }
export interface GearboxConfig { ratio: number; efficiency: number; backlash: number }
export interface MechanicsConfig { inertia: number; friction: number; maxSpeed: number; maxAcceleration: number; minPosition: number; maxPosition: number }
export interface MotorConfig { maxTorque: number; maxSpeed: number; response: number; degradation: number }
export interface AxisConfig { pid: PIDConfig; encoder: EncoderConfig; gearbox: GearboxConfig; mechanics: MechanicsConfig; motor: MotorConfig }
export interface AxisState { position: number; velocity: number; acceleration: number; command: number; torque: number; motorSpeed: number; trueEncoder: number; measuredEncoder: number; encoderStatus: EncoderStatus; error: number; pid: PIDTerms; pidState: PIDState; backlashState: number }
export interface SimulationConfig { az: AxisConfig; el: AxisConfig; targetAz: number; targetEl: number; disturbanceTorque: number; feedbackDelay: number; emergencyStop: boolean; watchdogTimeout: boolean }
export interface SimulationState { time: number; targetAz: number; targetEl: number; az: AxisState; el: AxisState; safety: 'NORMAL' | 'WARNING' | 'DEGRADED' | 'FAULT' | 'SAFE'; watchdog: 'NOMINAL' | 'TIMEOUT'; history: Array<{ time: number; targetAz: number; actualAz: number; targetEl: number; actualEl: number; azError: number; elError: number; commandAz: number; commandEl: number }>; events: string[] }
export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
export const defaultAxisConfig = (maxPosition: number): AxisConfig => ({ pid: { kp: 1.8, ki: 0.08, kd: 0.42, outputLimit: 100, integralLimit: 45, derivativeFilter: 0.25 }, encoder: { resolution: 0.025, noise: 0.02, offset: 0, samplePeriod: 0.025, failed: false, dropout: false }, gearbox: { ratio: 40, efficiency: 0.88, backlash: 0.4 }, mechanics: { inertia: maxPosition > 100 ? 1.8 : 1.15, friction: 0.08, maxSpeed: 28, maxAcceleration: 40, minPosition: 0, maxPosition }, motor: { maxTorque: 7.5, maxSpeed: 180, response: 0.12, degradation: 0 } })
export const defaultSimulationConfig = (): SimulationConfig => ({ az: defaultAxisConfig(360), el: defaultAxisConfig(90), targetAz: 68, targetEl: 32, disturbanceTorque: 0, feedbackDelay: 0, emergencyStop: false, watchdogTimeout: false })
export const initialAxisState = (position = 12): AxisState => ({ position, velocity: 0, acceleration: 0, command: 0, torque: 0, motorSpeed: 0, trueEncoder: position, measuredEncoder: position, encoderStatus: 'VALID', error: 0, pid: { p: 0, i: 0, d: 0, output: 0, saturated: false }, pidState: { integral: 0, previousError: 0, derivative: 0 }, backlashState: 0 })
export const initialSimulationState = (config = defaultSimulationConfig()): SimulationState => ({ time: 0, targetAz: config.targetAz, targetEl: config.targetEl, az: initialAxisState(), el: initialAxisState(), safety: 'NORMAL', watchdog: 'NOMINAL', history: [], events: ['SYSTEM INITIALIZED'] })

export const cloneConfig = (config: SimulationConfig): SimulationConfig => structuredClone(config)
export const cloneState = (state: SimulationState): SimulationState => structuredClone(state)

export function delayedMeasurement(history: number[], value: number, delaySeconds: number, dt: number) {
  const samples = Math.max(0, Math.round(delaySeconds / dt))
  history.push(value)
  while (history.length > samples + 1) history.shift()
  return history[Math.max(0, history.length - samples - 1)] ?? value
}
