import { clamp, PIDConfig, PIDState, PIDTerms } from './types'

export function updatePID(error: number, dt: number, config: PIDConfig, state: PIDState): PIDTerms {
  const safeDt = Math.max(dt, 1e-6)
  const derivativeRaw = (error - state.previousError) / safeDt
  state.derivative += (derivativeRaw - state.derivative) * clamp(config.derivativeFilter, 0, 1)
  const candidateIntegral = clamp(state.integral + error * safeDt, -config.integralLimit, config.integralLimit)
  const p = config.kp * error
  const d = config.kd * state.derivative
  const unclamped = p + config.ki * candidateIntegral + d
  const output = clamp(unclamped, -config.outputLimit, config.outputLimit)
  const saturated = output !== unclamped
  if (!saturated || Math.sign(error) !== Math.sign(unclamped - output)) state.integral = candidateIntegral
  state.previousError = error
  return { p, i: config.ki * state.integral, d, output, saturated }
}
export const resetPID = (state: PIDState) => { state.integral = 0; state.previousError = 0; state.derivative = 0 }
