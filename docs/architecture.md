# Current architecture

## Status

**Currently implemented:** A browser-only React client in `app/page.tsx` owns the UI, simulation state, periodic simulation tick, visualization, telemetry, health display, safety display, and event log.

**Planned:** Separate controller, plant, encoder, telemetry, health, and safety modules will be introduced incrementally after this baseline.

## Data flow

1. **User interface** — sliders and toggles update React state for targets, PID values, plant parameters, profiles, faults, and emergency stop.
2. **Target generation** — manual targets or sinusoidal/pass-like profiles produce AZ and EL references.
3. **Control calculation** — each axis calculates error and proportional, integral, and derivative contributions, then clamps the command to `-100..100`.
4. **Plant update** — command is converted into a simplified torque, acceleration, velocity, and position update. Friction, backlash, degradation, disturbance, and travel limits affect the result.
5. **Encoder measurement** — the position is quantized and noise is added. The encoder-dropout fault intermittently substitutes stale measured data.
6. **Visualization** — the antenna SVG, readouts, and charts consume the live simulation state and history.
7. **Health display** — visible subsystem bars and overall health are calculated from tracking error and active parameter/fault penalties.
8. **Safety display** — emergency stop, watchdog timeout, and encoder dropout can force SAFE and zero actuator commands.
9. **Event logging** — state changes and safe-mode transitions are added to an in-memory event list.

## Feedback loop

The current implementation is a compact closed loop:

`target -> error -> PID terms -> command -> simplified plant -> position -> measured feedback -> next tick`

The future architecture will make the following engineering loop explicit:

`Target -> Position Error -> PID Controller -> Motor Command -> Motor/Drive -> Gearbox -> Mechanical Dynamics -> Actual Position -> Encoder -> Measurement Processing -> Feedback -> PID`

A parallel supervisory path will be added later:

`Telemetry -> Health Monitor -> Fault Detection -> Safety Manager -> Safe State`

The watchdog and emergency stop are intended to remain independent, higher-priority safety paths.

## Scope of this phase

No new engineering behavior is added by this documentation phase. The implementation remains intentionally concentrated in one client component so the behavior can be learned before refactoring.

## Deployment

GitHub Pages configuration is planned but not yet present. The intended URL is `https://saadwajih99.github.io/SATCOM_Antenna_Project/` once a Pages workflow is established and verified.

## Source layout

- `app/page.tsx` — current UI and simulation implementation
- `app/globals.css` — dashboard presentation styles
- `docs/` — engineering and project documentation
- `public/` — static assets
- `next.config.mjs` — Next.js configuration
- `package.json` — package metadata and reproducible scripts

The project currently has no dedicated `src/` or `tests/` directory. Those boundaries will be introduced when reusable simulation modules and automated tests are added.

## Learning focus

When explaining this system in an interview, emphasize that the browser event handlers change state, the periodic tick advances the model, and React renders the resulting state. Removing the tick stops physical evolution; removing the state links breaks the connection between controls, simulation, visualization, health, and safety.
