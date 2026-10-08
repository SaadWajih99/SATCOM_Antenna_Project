# SATCOM Antenna Pointing, Health Monitoring & Fault-Injection Simulator

A browser-native engineering portfolio demonstrator for a simplified two-axis ground antenna. It models closed-loop PID pointing, actuator limitations, gearbox backlash, encoder imperfections, disturbances, health scoring, fault injection, watchdog behavior, and safety state transitions.

## Run locally

```bash
pnpm install
pnpm dev
```

Open the local URL printed by Next.js. Create a production build with `pnpm build` and run it with `pnpm start`.

## Model notes

The simulation runs client-side and separates the physics tick from the visual dashboard. Internally, angles are degrees for readability in this demonstrator. Each axis uses a discrete PID controller:

`u = Kp * e + Ki * integral(e) + Kd * derivative(e)`

The plant integrates torque into acceleration, velocity, and position while applying friction, travel limits, motor degradation, disturbances, and gearbox lost motion. Encoder readings are quantized and can be disturbed or dropped out. Overall health is transparent: control, motor, mechanical, and encoder health contribute to the displayed score.

This is intentionally not a certified SATCOM controller and does not model RF propagation, antenna radiation patterns, detailed motor electromagnetics, thermal behavior, structural FEA, atmospheric effects, or orbital mechanics.

## Scenarios

Use the profile selector for manual, sinusoidal, and satellite-pass-like tracking. Use fault injection to demonstrate encoder dropout, backlash, motor saturation, wind disturbance, feedback delay, and watchdog timeout. The emergency stop latches the system in SAFE until reset.

## GitHub Pages

The application is self-contained and can be deployed as a static client application through a GitHub Actions Pages workflow. For a Next.js deployment, configure the repository's Pages source to use the generated build artifact or export the client page to static HTML in a follow-up deployment branch.
