# Interview learning guide

## What the simulator demonstrates

This is an interactive electromechanical two-axis pointing demonstrator. The target is compared with delayed encoder feedback, a discrete PID controller produces a bounded command, and the motor, gearbox and mechanical model update antenna position. A supervisory path evaluates the measured behaviour and can put the drive into a safe state.

## Trace one control update

`targetAz` and `targetEl` are the commanded angles. The simulator reads the previous measured encoder values, applies optional feedback delay, computes position error, and calls `updatePID`. The command is converted into limited motor torque, reduced by degradation and gearbox efficiency, then integrated through inertia, friction, acceleration and speed limits. The resulting true position is quantised by the encoder and becomes feedback for the next update. The same state is used by the UI history and health/safety indicators.

## Concepts to explain

- **Closed loop:** feedback corrects the difference between desired and measured pointing instead of assuming the plant behaves perfectly.
- **PID:** proportional action reacts to present error, integral removes persistent bias, and derivative reacts to changing error. The implementation is discrete-time and uses a filtered derivative.
- **Saturation and anti-windup:** the actuator cannot deliver unlimited command; the integral is bounded and is not allowed to keep accumulating when saturation would worsen recovery.
- **Backlash:** direction reversal can create lost motion before the load responds, so a controller may show error even while the motor is moving.
- **Encoder imperfections:** quantisation, offset, dropout and failure alter the feedback signal, not merely a display score.
- **Watchdog and safety:** these are supervisory mechanisms independent of PID. An emergency stop or timeout has priority and commands zero drive.

## Defensible limitations

The simulator deliberately abstracts high-fidelity RF, structural and electromagnetic phenomena while retaining the electromechanical behaviours most relevant to antenna pointing, control, fault detection and safety. It is not a certified controller or a flight-qualified safety system. Angles are displayed in degrees; the simplified plant uses bounded numerical integration rather than a detailed motor field model.
