# Engineering model

The target generator produces manual, sinusoidal, or smooth pass-like AZ/EL references. At each simulation tick, measured position is compared with the target. The PID controller exposes proportional, integral, and derivative contributions and clamps command to actuator limits.

The plant applies a simplified relationship `torque -> acceleration -> velocity -> position`, with inertia and friction. Gearbox backlash reduces motion around direction reversals. Motor degradation reduces available torque. Encoder quantization, noise, dropout, and offset represent sensing imperfections. Wind adds a bounded sinusoidal disturbance torque.

Health is deliberately explainable rather than predictive. Tracking error, motor degradation/saturation, backlash, and encoder validity contribute penalties to subsystem scores. Overall health is the bounded mean of the visible subsystem health values with a stronger penalty for encoder validity because closed-loop position feedback is safety critical.

## Safety assumptions

An emergency stop, encoder dropout, or watchdog timeout forces motor command to zero and enters SAFE. Reset is explicit; the controller does not automatically restart after a latched stop.
