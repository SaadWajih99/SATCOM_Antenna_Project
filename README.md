# SATCOM Antenna Engineering Simulator

Interactive SATCOM antenna pointing and control engineering simulator.

**Current status:** Early engineering demonstrator. The current browser UI and simulation are intentionally concentrated in `app/page.tsx`; reusable engineering modules and automated tests are planned for later phases.

## Run locally

```bash
pnpm install
pnpm dev
```

Open the local URL printed by Next.js.

## Build

```bash
pnpm build
```

## Documentation

- [Architecture](docs/architecture.md)
- [Engineering model](docs/engineering-model.md)
- [Safety](docs/safety-system.md)
- [Faults and health](docs/faults-and-health.md)
- [Testing](docs/testing.md)
- [Assumptions and limitations](docs/assumptions-and-limitations.md)

GitHub Pages deployment is not configured yet. It will be established in a later phase after this baseline is reviewed.
