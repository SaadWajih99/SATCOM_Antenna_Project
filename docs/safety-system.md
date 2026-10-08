# Safety system

## Current safety behaviour

The current dashboard exposes four states: `NORMAL`, `DEGRADED`, `FAULT`, and `SAFE`.

- `NORMAL` is selected when the hand-tuned health score is above 85%.
- `DEGRADED` is selected when health is above 60% and at or below 85%.
- `FAULT` is selected below 60%.
- `SAFE` takes priority when emergency stop is active, the watchdog fault is injected, or the encoder-dropout interval is active.

When SAFE is selected, both axis commands are set to zero and the UI reports that motors are disabled. The reset control clears the emergency-stop latch and reinitializes the simulation. Travel limits clamp AZ to `0..360` degrees and EL to `0..90` degrees.

This is software demonstration behavior. It is not a certified safety PLC, drive inhibit, hardware interlock, or flight-qualified protection system.

## Important current limitations

The current watchdog is an injected fault state rather than an independent heartbeat monitor. Encoder dropout is also directly coupled to the injected fault behavior. There is no explicit safety transition history, reset authorization model, independent fault detector, or hardware separation from the controller.

## Planned safety architecture

The planned deterministic state machine is:

`NORMAL -> WARNING -> DEGRADED -> FAULT -> SAFE`

A future safety manager will have priority over normal control and will consume measured health and fault evidence. Planned responses include:

- invalid encoder feedback -> disable drive and enter SAFE;
- watchdog timeout -> command zero and enter SAFE;
- travel limit -> stop the relevant axis;
- motor overload -> reduce or disable the affected command;
- emergency stop -> command zero, enter SAFE, and require explicit reset.

The watchdog should operate independently of the PID controller so a controller software failure cannot suppress the safety response. These planned behaviors are not implemented as separate modules in the current phase.

## Interview explanation

Explain that safety is an override path: normal PID output is computed first, but a higher-priority safety condition can replace it with zero. The next phase should turn this implicit conditional into a testable state machine with explicit transitions and evidence thresholds.
