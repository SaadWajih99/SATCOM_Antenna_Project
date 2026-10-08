import { AxisConfig, AxisState, clamp } from './types'
import { updatePID } from './pidController'

export function measureEncoder(truePosition: number, config: AxisConfig['encoder'], time: number) {
  if (config.failed) return { position: truePosition, status: 'FAILED' as const }
  if (config.dropout && Math.floor(time / Math.max(config.samplePeriod, 0.001)) % 5 === 0) return { position: truePosition, status: 'DROPOUT' as const }
  const quantized = Math.round((truePosition + config.offset) / config.resolution) * config.resolution
  return { position: quantized, status: 'VALID' as const }
}

export function stepAxis(state: AxisState, target: number, config: AxisConfig, dt: number, time: number, feedback: number, disturbance: number): AxisState {
  const error = target - feedback
  const pid = updatePID(error, dt, config.pid, state.pidState)
  const capability = clamp(1 - config.motor.degradation / 100, 0, 1)
  const torque = clamp(pid.output / 100 * config.motor.maxTorque * capability, -config.motor.maxTorque * capability, config.motor.maxTorque * capability)
  const motorSpeed = clamp(state.motorSpeed + ((pid.output / 100 * config.motor.maxSpeed) - state.motorSpeed) * dt / Math.max(config.motor.response, 0.001), -config.motor.maxSpeed, config.motor.maxSpeed)
  const transmittedTorque = torque * config.gearbox.efficiency
  const frictionTorque = config.mechanics.friction * Math.sign(state.velocity)
  const rawAcceleration = (transmittedTorque - frictionTorque + disturbance) / Math.max(config.mechanics.inertia, 0.001)
  const acceleration = clamp(rawAcceleration, -config.mechanics.maxAcceleration, config.mechanics.maxAcceleration)
  const velocity = clamp(state.velocity + acceleration * dt, -config.mechanics.maxSpeed, config.mechanics.maxSpeed)
  const directionChange = velocity !== 0 && Math.sign(velocity) !== Math.sign(state.velocity)
  const backlashLoss = directionChange ? config.gearbox.backlash : 0
  const position = clamp(state.position + (Math.abs(velocity) > 0.01 ? velocity * dt : 0) - backlashLoss, config.mechanics.minPosition, config.mechanics.maxPosition)
  const encoder = measureEncoder(position, config.encoder, time)
  return { ...state, position, velocity, acceleration, command: pid.output, torque, motorSpeed, trueEncoder: position, measuredEncoder: encoder.position, encoderStatus: encoder.status, error, pid, backlashState: backlashLoss }
}
