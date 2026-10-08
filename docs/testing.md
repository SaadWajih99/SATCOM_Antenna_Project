# Testing

## Current verification

The current project is verified primarily through the reproducible project commands:

```bash
pnpm install
pnpm exec tsc --noEmit
pnpm build
```

Manual verification covers loading the dashboard, changing targets and profiles, changing PID and plant controls, observing the antenna and charts, activating faults, observing health and safety displays, and using emergency stop/reset.

**Automated engineering tests are not yet implemented.**

## Planned tests

The future test suite will verify behavior rather than only execution:

- PID calculation
- output saturation
- anti-windup
- encoder noise, offset, and failure
- backlash
- friction
- motor degradation and saturation
- travel limits
- feedback delay
- watchdog timeout
- emergency stop
- safety transitions

Reusable modules should be added before this suite so each test can isolate one engineering concept and its units/assumptions.
