# Engineering model

## Current implementation

The model is a deliberately compact, client-side two-axis demonstrator. Values are displayed in degrees and percentages; the code does not establish a complete SI unit system.

### Target generation

- Manual mode uses the AZ and EL slider values.
- Sine mode generates bounded sinusoidal AZ and EL references.
- Pass mode generates slower sinusoidal, satellite-pass-like references.

**Input:** simulation time, profile, target parameters.  
**Output:** AZ/EL target angles.  
**Interpretation:** a commanded pointing reference, not orbital propagation.

### PID calculation

For each axis, the code calculates:

`error = target - measuredFeedback`

`P = Kp * error`

`I_next = clamp(I_previous + Ki * error * dt, -45, 45)`

`D = Kd * (error - previousError) / dt`

`command = clamp(P + I_next + D, -100, 100)`

**Inputs:** target, feedback, previous error, previous integral, `dt`, Kp/Ki/Kd.  
**Output:** bounded normalized actuator command and visible P/I/D terms.  
**Physical interpretation:** proportional correction, accumulated bias correction, and rate-of-error damping.  
**Simplifications:** no derivative filter, explicit integral anti-windup beyond integral clamping, or reusable controller module yet.

### Actuator and plant update

The command is scaled into an available torque. Motor degradation and the motor fault reduce available torque. A simplified update then uses:

`acceleration = (torque * 0.075 - friction * velocity + disturbance) / axisScale`

`velocity_next = clamp(velocity + acceleration * dt, -28, 28)`

`position_next = clamp(position + velocity * dt * motionFactor, travelMin, travelMax)`

**Inputs:** command, degradation, friction, velocity, disturbance, `dt`.  
**Outputs:** position and velocity.  
**Interpretation:** a low-order electromechanical approximation.  
**Simplifications:** inertia is represented by fixed axis scale factors; motor electrical dynamics, explicit gearbox ratio/efficiency, and detailed torque units are not modeled.

### Backlash, friction, and disturbance

Backlash reduces motion by a fixed factor when velocity exceeds the motion threshold. The excessive-backlash fault increases both effective friction and lost motion. Wind disturbance is a bounded sinusoidal term added to acceleration.

### Encoder

Normal measurements add small random noise and quantize position to approximately 0.025 degree increments. Encoder dropout intermittently uses stale measurement; outside the dropout interval it uses position plus larger random noise.

**Planned:** explicit encoder resolution, sampling rate, zero offset, validity status, and feedback delay models.

### Safety override

Emergency stop, watchdog fault, or the encoder dropout interval can classify the system as SAFE. In SAFE, both axis commands are set to zero. Travel limits clamp AZ to `0..360` and EL to `0..90`.

## Planned models

The following are intentionally not implemented as independent engineering modules yet: explicit inertia parameters, gearbox ratio, gearbox efficiency, a direction-aware backlash model, motor response/inertia, encoder sampling, feedback delay, formal fault detection, deterministic health thresholds, and a safety state machine.

## Learning focus

Changing Kp changes immediate correction, Ki changes accumulated correction, and Kd changes response to error slope. Changing friction or degradation changes the plant response rather than merely changing a label. The next PID iteration should preserve these visible cause-and-effect links while moving equations into testable modules.
