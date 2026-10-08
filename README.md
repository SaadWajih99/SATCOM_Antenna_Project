# SATCOM Antenna Engineering Simulator

An interactive browser-based simulator for two-axis SATCOM antenna pointing, control, fault detection, health monitoring, and safety behavior.

**Live demo:** https://saadwajih99.github.io/SATCOM_Antenna_Project/

## Why this project exists

This is an interview-ready engineering demonstrator for explaining a closed-loop electromechanical control system. It intentionally keeps the model understandable instead of hiding the behavior behind a black box.

> The simulator deliberately abstracts high-fidelity RF, structural and electromagnetic phenomena while retaining the electromechanical behaviours most relevant to antenna pointing, control, fault detection and safety.

## What is simulated

- Azimuth and elevation target tracking
- PID control with visible P, I, and D contributions
- Simplified motor, gearbox, inertia, friction, backlash, and saturation behavior
- Encoder measurement and feedback behavior
- Disturbance torque and feedback delay
- Fault injection for encoder dropout, backlash, motor degradation, wind, delay, and watchdog timeout
- Health monitoring, safety state, emergency stop, watchdog, telemetry, and performance metrics
- Manual, sinusoidal, and satellite-pass target profiles

The project does **not** attempt detailed RF propagation, orbital mechanics, antenna radiation patterns, FEM, atmospheric modeling, or detailed electromagnetic motor equations.

## Quick start

Requirements: Node.js 22+ and pnpm 12+.

```bash
pnpm install
pnpm dev
```

Open the local URL printed by Next.js, normally `http://localhost:3000`.

## Quality checks

```bash
pnpm test       # engineering behavior tests
pnpm exec tsc --noEmit
pnpm build      # production static export
```

The GitHub Pages workflow runs the same checks before deploying `out/`.

## System architecture

```text
Target
  -> position error
  -> PID controller
  -> motor command
  -> motor / drive
  -> gearbox
  -> antenna mechanical dynamics
  -> actual position
  -> encoder and measurement processing
  -> feedback
  -> PID

Telemetry -> health monitor -> fault detection -> safety manager -> safe state
Watchdog and emergency stop operate independently and have priority over normal control.
```

The implementation is organized so the engineering model can be studied separately from the dashboard:

- `app/page.tsx` — interactive dashboard and simulation wiring
- `src/simulation/pidController.ts` — PID calculation, saturation, and anti-windup
- `src/simulation/plant.ts` — axis plant, motor, gearbox, friction, backlash, and encoder behavior
- `src/simulation/simulator.ts` — two-axis orchestration, faults, telemetry, safety, and metrics
- `src/simulation/types.ts` — explicit model contracts
- `tests/simulation.test.ts` — behavior-focused engineering tests
- `docs/` — architecture, assumptions, safety, faults, testing, and interview notes

## How to use the dashboard

1. Move the azimuth or elevation target in **Target Generator**.
2. Tune `Kp`, `Ki`, and `Kd` and observe the live response.
3. Adjust backlash, friction, and motor degradation to change plant behavior.
4. Enable a fault in **Fault Injection** and watch telemetry, health, event log, and safety state respond.
5. Use **E-STOP** to force a safe state; use reset to re-enable the model.
6. Compare target, actual, measured encoder position, error, and control effort in the charts.

## Documentation

- [Architecture](docs/architecture.md)
- [Engineering model](docs/engineering-model.md)
- [Faults and health](docs/faults-and-health.md)
- [Safety system](docs/safety-system.md)
- [Testing](docs/testing.md)
- [Assumptions and limitations](docs/assumptions-and-limitations.md)
- [Interview guide](docs/interview-guide.md)

## Deployment

GitHub Actions builds and deploys the static export to GitHub Pages on pushes to `main`. The expected URL is:

`https://saadwajih99.github.io/SATCOM_Antenna_Project/`

If the repository is forked or renamed, update the base path in `next.config.mjs` and this URL.

## License

This project is a personal engineering portfolio demonstrator. Add a license before distributing it as reusable software.

## Learning goal

Every important signal should be traceable from target slider to physical response:

`target -> error -> PID -> motor -> gearbox -> mechanics -> antenna position -> encoder -> feedback -> charts -> health -> safety`

Use the documentation and source modules together when preparing to explain the project in an interview.

---

Built as a small, inspectable engineering simulator rather than a production antenna controller.

### Project principles

1. Prefer explicit engineering variables over hidden magic.
2. Keep safety behavior deterministic and higher priority than control.
3. Test behavior, not only code coverage.
4. Document abstractions and limitations before increasing model complexity.
5. Keep the dashboard readable enough to support technical discussion.

### Expected interview demonstration

Start in manual tracking, change the azimuth target, explain the error and PID response, then enable excessive backlash or encoder dropout. Point to the changed actual/measured position, the tracking error, the health monitor, event log, and safety state. Finish with emergency stop and reset to demonstrate command priority.

### Source of truth

All simulator code, tests, documentation, and deployment configuration live in this repository. Do not rely on generated preview files or local-only state.

### Versioning

The current portfolio demonstrator version is `0.1.x`. Changes should use focused commits such as `feat: add encoder model`, `test: add safety transitions`, or `docs: clarify assumptions`.

### Support

For project-specific questions, open a GitHub issue with the observed input, expected behavior, actual behavior, and the relevant simulation parameters.

### Accessibility

The dashboard uses semantic controls, visible labels, status text, and high-contrast telemetry colors. When adding controls, keep keyboard operation and readable status text intact.

### Final note

The best way to learn this project is to change one parameter at a time and trace the result through the source modules and dashboard telemetry.

### Repository URL

https://github.com/SaadWajih99/SATCOM_Antenna_Project

### Live URL

https://saadwajih99.github.io/SATCOM_Antenna_Project/

### Build target

Static Next.js export for GitHub Pages.

### Runtime target

Modern desktop and mobile browsers.

### Data policy

No database, authentication, API keys, or backend service is required.

### Contact

Use the repository issue tracker for technical discussion.

### Status

Active incremental development.

### Scope

Interactive electromechanical SATCOM antenna pointing.

### Focus

Control, mechanics, telemetry, faults, health, and safety.

### Out of scope

High-fidelity RF and orbital simulation.

### Summary

A compact engineering simulator for learning and interview discussion.
