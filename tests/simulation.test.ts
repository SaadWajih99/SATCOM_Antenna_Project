import { describe, expect, it } from 'vitest'
import { updatePID } from '../src/simulation/pidController'
import { defaultSimulationConfig } from '../src/simulation/types'
import { measureEncoder } from '../src/simulation/plant'
import { AntennaSimulator } from '../src/simulation/simulator'

describe('PID controller', () => {
  it('produces proportional output', () => {
    const config = { kp: 2, ki: 0, kd: 0, outputLimit: 100, integralLimit: 10, derivativeFilter: 1 }
    const terms = updatePID(3, 0.1, config, { integral: 0, previousError: 0, derivative: 0 })
    expect(terms.p).toBe(6)
    expect(terms.output).toBe(6)
  })
  it('saturates and limits integral growth', () => {
    const config = { kp: 100, ki: 10, kd: 0, outputLimit: 20, integralLimit: 1, derivativeFilter: 1 }
    const state = { integral: 0, previousError: 0, derivative: 0 }
    const terms = updatePID(10, 1, config, state)
    expect(terms.output).toBe(20)
    expect(state.integral).toBeLessThanOrEqual(1)
  })
})

describe('encoder', () => {
  it('quantizes and applies offset', () => {
    const result = measureEncoder(12.13, { resolution: 0.1, noise: 0, offset: 0.2, samplePeriod: 0.1, failed: false, dropout: false }, 1)
    expect(result.position).toBe(12.3)
    expect(result.status).toBe('VALID')
  })
  it('reports failed feedback', () => {
    const result = measureEncoder(12, { resolution: 0.1, noise: 0, offset: 0, samplePeriod: 0.1, failed: true, dropout: false }, 1)
    expect(result.status).toBe('FAILED')
  })
})

describe('antenna simulator', () => {
  it('moves both axes toward their targets', () => {
    const simulator = new AntennaSimulator()
    const initial = simulator.snapshot()
    for (let i = 0; i < 100; i += 1) simulator.update(0.02)
    expect(simulator.state.az.position).toBeGreaterThan(initial.az.position)
    expect(simulator.state.el.position).toBeGreaterThan(initial.el.position)
    expect(simulator.state.history.length).toBeGreaterThan(0)
  })
  it('enters safe state for emergency stop and zeroes commands', () => {
    const config = defaultSimulationConfig()
    config.emergencyStop = true
    const simulator = new AntennaSimulator(config)
    simulator.update(0.02)
    expect(simulator.state.safety).toBe('SAFE')
    expect(simulator.state.az.command).toBe(0)
    expect(simulator.state.el.command).toBe(0)
  })
})
