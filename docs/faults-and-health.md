# Faults and health

## Current faults

### Encoder dropout
- **Current implementation:** intermittently uses stale measured feedback and otherwise adds larger noise.
- **Effect on simulation:** the controller can act on invalid or delayed position feedback; the fault interval contributes to SAFE behavior.
- **Effect on UI:** encoder health falls, events can report encoder/watchdog safe mode, and the safety panel shows motors disabled during SAFE.
- **Limitations:** no explicit validity flag, timestamp, diagnostic code, or independent fault detector exists yet.

### Excessive backlash
- **Current implementation:** raises effective friction and increases lost-motion factor.
- **Effect on simulation:** position response becomes less effective.
- **Effect on UI:** mechanical health falls and overall health is penalized.
- **Limitations:** not direction-aware and not a physical gearbox model.

### Motor saturation/degradation fault
- **Current implementation:** reduces available torque to 52% when enabled; the degradation slider independently reduces torque.
- **Effect on simulation:** slower response and larger tracking error.
- **Effect on UI:** motor health and overall health fall.
- **Limitations:** command saturation is still a simple clamp and does not yet expose overload duration or thermal state.

### Wind disturbance
- **Current implementation:** adds a bounded sinusoidal disturbance term to acceleration.
- **Effect on simulation:** introduces motion disturbance and tracking error.
- **Effect on UI:** tracking and health can degrade.
- **Limitations:** not a stochastic or physical wind-torque model.

### Feedback delay
- **Current implementation:** the control equation does not currently delay feedback; the active flag only contributes a health penalty.
- **Effect on simulation:** no direct plant response change yet.
- **Effect on UI:** overall health is reduced while the fault is active.
- **Limitations:** this is a known placeholder and must not be presented as a working delay model.

### Watchdog timeout
- **Current implementation:** sets watchdog time to a timeout value and forces SAFE.
- **Effect on simulation:** actuator commands become zero.
- **Effect on UI:** watchdog shows TIMEOUT and safety shows motors disabled.
- **Limitations:** no independent heartbeat timer exists yet; it is currently an injected state.

## Current health calculation

The current overall health is a bounded hand-tuned penalty score based on point tracking error, motor degradation, encoder fault, backlash fault, motor fault, and feedback-delay penalty. The dashboard also displays separate control, motor, mechanical, and encoder bars using similarly direct formulas.

This is explainable demonstration logic, not a formal diagnostic architecture. It does not yet use a measured fault evidence model, persistence timers, hysteresis, or a common severity enum.

## Planned architecture

Future health monitoring will consume measurable telemetry: RMS and maximum tracking error, command saturation duration, encoder validity/quality, motor overload/degradation, mechanical response, watchdog state, and safety state. Thresholds will map evidence to GREEN/HEALTHY, YELLOW/WARNING, ORANGE/DEGRADED, and RED/FAULT states with documented hysteresis and deterministic safety actions.
