# Safety system

The dashboard presents four states: NORMAL, DEGRADED, FAULT, and SAFE. NORMAL is used when health is above 85%. DEGRADED indicates a health score between 60% and 85%. FAULT is below 60%. SAFE is latched when emergency stop, watchdog timeout, or encoder dropout is active.

SAFE removes actuator command and requires the reset control to re-enable operation. Travel limits clamp the physical state and prevent impossible positions. This is a software demonstration only and is not a substitute for a certified safety PLC, drive inhibit, or antenna interlock design.
