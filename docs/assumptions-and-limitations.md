# Assumptions and limitations

The simulator deliberately abstracts high-fidelity RF, structural and electromagnetic phenomena while retaining the electromechanical behaviours most relevant to antenna pointing, control, fault detection and safety.

It is:

- an engineering demonstrator;
- an interview and learning project;
- a browser-based interactive approximation.

It is not:

- a certified SATCOM controller;
- a flight-qualified system;
- a complete RF simulator;
- a high-fidelity structural model;
- a detailed orbital mechanics simulator;
- a detailed electromagnetic motor model;
- a substitute for safety PLCs, drive interlocks, or hardware emergency stops.

Current limitations include a single concentrated client component, simplified fixed-scale plant dynamics, approximate degree-based calculations, hand-tuned health penalties, injected rather than independently detected watchdog behavior, and no automated engineering test suite. GitHub Pages deployment is also not configured in this phase.

Future work will separate the model into reusable modules, document units and thresholds more rigorously, add deterministic fault and safety tests, and then establish a verified static deployment.
