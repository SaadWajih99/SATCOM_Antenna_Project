'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Activity, AlertTriangle, Antenna, Ban, CheckCircle2, Gauge, RotateCcw, Settings2, ShieldCheck, SlidersHorizontal, Wind, Zap } from 'lucide-react'

type Axis = { position: number; velocity: number; target: number; measured: number; command: number; error: number; p: number; i: number; d: number; truePosition: number }
type Sim = { time: number; az: Axis; el: Axis; health: number; state: 'NORMAL' | 'DEGRADED' | 'FAULT' | 'SAFE'; watchdog: number; rms: number; maxError: number; events: string[]; history: { t: number; target: number; actual: number; error: number; command: number; measured: number }[] }
const initialAxis = (target: number): Axis => ({ position: 12, velocity: 0, target, measured: 12, command: 0, error: target - 12, p: 0, i: 0, d: 0, truePosition: 12 })
const initialSim = (): Sim => ({ time: 0, az: initialAxis(68), el: initialAxis(32), health: 100, state: 'NORMAL', watchdog: 0, rms: 0, maxError: 0, events: ['SYSTEM INITIALIZED', 'Controller heartbeat nominal'], history: [] })

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
const fmt = (v: number, digits = 1) => Number.isFinite(v) ? v.toFixed(digits) : '—'

export default function Page() {
  const [sim, setSim] = useState<Sim>(initialSim)
  const [running, setRunning] = useState(true)
  const [profile, setProfile] = useState('manual')
  const [faults, setFaults] = useState({ encoder: false, backlash: false, motor: false, wind: false, delay: false, watchdog: false })
  const [params, setParams] = useState({ azTarget: 68, elTarget: 32, kp: 1.8, ki: 0.08, kd: 0.42, backlash: 0.4, friction: 0.08, degradation: 0, delay: 0.2, wind: 0 })
  const [estop, setEstop] = useState(false)
  const last = useRef(performance.now())

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      const now = performance.now(); const dt = clamp((now - last.current) / 1000, 0.01, 0.08); last.current = now
      setSim(prev => {
        const t = prev.time + dt
        const targetAz = profile === 'sine' ? 70 + 28 * Math.sin(t * 0.32) : profile === 'pass' ? 45 + 50 * Math.sin((t - 2) * 0.12) : params.azTarget
        const targetEl = profile === 'sine' ? 34 + 12 * Math.sin(t * 0.32 + 1) : profile === 'pass' ? 38 + 18 * Math.sin((t - 2) * 0.12 + 0.7) : params.elTarget
        const step = (axis: Axis, target: number, axisName: string) => {
          const actualFeedback = faults.encoder ? axis.measured : axis.position
          const error = target - actualFeedback
          const p = params.kp * error
          const i = clamp(axis.i + params.ki * error * dt, -45, 45)
          const d = params.kd * (error - axis.error) / dt
          const raw = p + i + d
          const command = clamp(raw, -100, 100)
          const torque = command * (1 - params.degradation / 100) * (faults.motor ? 0.52 : 1)
          const windForce = faults.wind ? Math.sin(t * 2.7 + (axisName === 'EL' ? 1 : 0)) * 0.22 : 0
          const friction = params.friction + (faults.backlash ? 0.18 : 0)
          const acceleration = (torque * 0.075 - friction * axis.velocity + windForce) / (axisName === 'AZ' ? 1.8 : 1.15)
          const velocity = clamp(axis.velocity + acceleration * dt, -28, 28)
          const backlash = (faults.backlash ? 3.5 : params.backlash) / 2
          const position = clamp(axis.position + (Math.abs(velocity) > 0.7 ? velocity * dt * (1 - backlash / 100) : 0), axisName === 'AZ' ? 0 : 0, axisName === 'AZ' ? 360 : 90)
          const noise = faults.encoder ? (Math.random() - 0.5) * 1.5 : (Math.random() - 0.5) * 0.035
          const measured = faults.encoder ? (t % 4 < 1.7 ? axis.measured : position + noise) : Math.round((position + noise) * 40) / 40
          return { ...axis, position, truePosition: position, velocity, target, measured, command, error, p, i, d }
        }
        const az = step(prev.az, targetAz, 'AZ'); const el = step(prev.el, targetEl, 'EL')
        const pointError = Math.hypot(az.error, el.error); const history = [...prev.history, { t, target: targetAz, actual: az.position, error: pointError, command: az.command, measured: az.measured }].slice(-90)
        const health = clamp(100 - pointError * 0.22 - params.degradation * 0.35 - (faults.encoder ? 34 : 0) - (faults.backlash ? 15 : 0) - (faults.motor ? 13 : 0) - (faults.delay ? 10 : 0), 0, 100)
        const safe = estop || faults.watchdog || faults.encoder && t % 4 < 1.7
        const state = safe ? 'SAFE' : health < 60 ? 'FAULT' : health < 86 ? 'DEGRADED' : 'NORMAL'
        const event = safe && prev.state !== 'SAFE' ? (estop ? 'EMERGENCY STOP — SAFE MODE' : 'ENCODER / WATCHDOG FAULT — SAFE MODE') : !safe && prev.state === 'SAFE' ? 'SYSTEM RESET — CONTROL ENABLED' : prev.state !== state ? `${state} STATE ENTERED` : ''
        return { ...prev, time: t, az: safe ? { ...az, command: 0 } : az, el: safe ? { ...el, command: 0 } : el, health, state, watchdog: faults.watchdog ? 3.2 : 0.2, rms: Math.sqrt(history.reduce((s, x) => s + x.error ** 2, 0) / history.length), maxError: Math.max(prev.maxError, pointError), history, events: event ? [event, ...prev.events].slice(0, 6) : prev.events }
      })
    }, 50)
    return () => clearInterval(id)
  }, [running, profile, params, faults, estop])

  const setParam = (key: keyof typeof params, value: number) => setParams(p => ({ ...p, [key]: value }))
  const healthColor = sim.health > 85 ? 'good' : sim.health > 60 ? 'warn' : 'bad'
  const chart = useMemo(() => sim.history.length ? sim.history : [{ t: 0, target: 68, actual: 12, error: 56, command: 0, measured: 12 }], [sim.history])
  const chartPath = (key: keyof typeof chart[number], min: number, max: number) => chart.map((d, i) => `${i ? 'L' : 'M'} ${(i / Math.max(1, chart.length - 1)) * 100} ${100 - ((Number(d[key]) - min) / (max - min)) * 100}`).join(' ')

  return <main className="dashboard-shell">
    <header className="topbar"><div className="brand"><div className="brand-mark"><Antenna size={21} /></div><div><p className="eyebrow">GROUND SEGMENT / ENGINEERING SIMULATION</p><h1>SATCOM <span>ANTENNA</span> CONTROL</h1></div></div><div className="top-status"><span className={`status-dot ${healthColor}`} /> <span>OVERALL HEALTH</span><strong>{fmt(sim.health, 0)}%</strong><span className={`state-pill ${sim.state.toLowerCase()}`}>{sim.state}</span></div></header>
    <section className="summary-strip"><div><span>SIM TIME</span><strong>{fmt(sim.time, 1)} s</strong></div><div><span>AZ TARGET</span><strong>{fmt(sim.az.target)}°</strong></div><div><span>EL TARGET</span><strong>{fmt(sim.el.target)}°</strong></div><div><span>RMS ERROR</span><strong>{fmt(sim.rms)}°</strong></div><div><span>WATCHDOG</span><strong className={sim.watchdog > 1 ? 'text-red' : ''}>{sim.watchdog > 1 ? 'TIMEOUT' : 'NOMINAL'}</strong></div><div className="run-control"><button className="ghost-btn" onClick={() => setRunning(v => !v)}>{running ? 'PAUSE' : 'RESUME'}</button><button className="danger-btn" onClick={() => { setEstop(true); setRunning(true) }}><Ban size={14} /> E-STOP</button><button className="icon-btn" aria-label="Reset" onClick={() => { setSim(initialSim()); setEstop(false); setRunning(true) }}><RotateCcw size={16} /></button></div></section>

    <div className="workspace"><aside className="sidebar"><Panel title="TARGET GENERATOR" icon={<SlidersHorizontal size={15} />}><label className="field-label">TRACKING PROFILE<select value={profile} onChange={e => setProfile(e.target.value)}><option value="manual">Manual command</option><option value="sine">Sinusoidal tracking</option><option value="pass">Satellite pass</option></select></label><Range label="AZ TARGET" value={params.azTarget} min={0} max={360} unit="°" onChange={v => setParam('azTarget', v)} /><Range label="EL TARGET" value={params.elTarget} min={0} max={90} unit="°" onChange={v => setParam('elTarget', v)} /></Panel>
      <Panel title="PID CONTROLLER" icon={<Gauge size={15} />}><Range label="PROPORTIONAL / KP" value={params.kp} min={0} max={4} step={0.1} onChange={v => setParam('kp', v)} /><Range label="INTEGRAL / KI" value={params.ki} min={0} max={0.5} step={0.01} onChange={v => setParam('ki', v)} /><Range label="DERIVATIVE / KD" value={params.kd} min={0} max={1.5} step={0.01} onChange={v => setParam('kd', v)} /><div className="pid-readout"><span>P <b>{fmt(sim.az.p)}</b></span><span>I <b>{fmt(sim.az.i)}</b></span><span>D <b>{fmt(sim.az.d)}</b></span></div></Panel>
      <Panel title="PLANT PARAMETERS" icon={<Settings2 size={15} />}><Range label="BACKLASH" value={params.backlash} min={0} max={4} step={0.1} unit="°" onChange={v => setParam('backlash', v)} /><Range label="FRICTION" value={params.friction} min={0} max={0.4} step={0.01} onChange={v => setParam('friction', v)} /><Range label="MOTOR DEGRADATION" value={params.degradation} min={0} max={70} unit="%" onChange={v => setParam('degradation', v)} /></Panel></aside>

      <section className="main-column"><div className="antenna-card"><div className="card-heading"><div><p className="eyebrow">LIVE PLANT MODEL</p><h2>Two-axis pointing geometry</h2></div><span className="live-tag"><span className="status-dot good" /> LIVE</span></div><div className="antenna-stage"><div className="radar-grid" /><div className="axis-readout az"><span>AZIMUTH</span><strong>{fmt(sim.az.position)}°</strong><small>CMD {fmt(sim.az.command, 0)}%</small></div><div className="axis-readout el"><span>ELEVATION</span><strong>{fmt(sim.el.position)}°</strong><small>ERR {fmt(sim.el.error)}°</small></div><svg className="dish-svg" viewBox="0 0 520 280" role="img" aria-label="Animated antenna pointing visualization"><defs><linearGradient id="dish" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#3bc5d4" stopOpacity=".9" /><stop offset="1" stopColor="#166b82" stopOpacity=".65" /></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs><line x1="260" y1="247" x2="260" y2="68" stroke="#36576c" strokeWidth="5" /><path d="M220 247h80" stroke="#5e8495" strokeWidth="7" strokeLinecap="round" /><g transform={`rotate(${sim.az.position - 12} 260 194)`}><path d="M145 164 Q260 250 375 164 Q350 249 260 257 Q170 249 145 164Z" fill="url(#dish)" stroke="#83e1e2" strokeWidth="2" /><line x1="260" y1="205" x2="260" y2="112" stroke="#d3fbfb" strokeWidth="3" /><circle cx="260" cy="105" r="7" fill="#f6b84b" filter="url(#glow)" /><path d="M260 105L260 39" stroke="#f6b84b" strokeDasharray="5 5" opacity=".8" /></g><path d={`M260 39 L${260 + Math.sin((sim.az.target - 12) * Math.PI / 180) * 105} ${39 + Math.cos((sim.az.target - 12) * Math.PI / 180) * 40}`} stroke="#f6b84b" strokeDasharray="3 5" opacity=".7" /><text x="18" y="266" fill="#7595a8" fontSize="10">0°</text><text x="475" y="266" fill="#7595a8" fontSize="10">360°</text></svg><div className="target-legend"><span><i className="legend-line target" /> TARGET VECTOR</span><span><i className="legend-line actual" /> ACTUAL AXIS</span></div></div></div>
        <div className="charts-grid"><Chart title="AZ TRACKING / TARGET VS ACTUAL" data={chart} paths={[{ key: 'target', color: '#f6b84b', min: 0, max: 360 }, { key: 'actual', color: '#55d4dc', min: 0, max: 360 }]} /><Chart title="CONTROL EFFORT / MOTOR COMMAND" data={chart} paths={[{ key: 'command', color: '#b18cff', min: -100, max: 100 }]} /></div></section>

      <aside className="rightbar"><Panel title="HEALTH MONITOR" icon={<Activity size={15} />}><HealthRow name="CONTROL LOOP" value={Math.max(0, 100 - sim.rms * 1.3)} /><HealthRow name="MOTOR / DRIVE" value={100 - params.degradation - (faults.motor ? 25 : 0)} /><HealthRow name="MECHANICAL" value={100 - (faults.backlash ? 36 : params.backlash * 5) - params.degradation * .3} /><HealthRow name="ENCODER" value={faults.encoder ? 38 : 100} /></Panel><Panel title="FAULT INJECTION" icon={<AlertTriangle size={15} />}><FaultToggle label="Encoder dropout" active={faults.encoder} onChange={() => setFaults(f => ({ ...f, encoder: !f.encoder }))} /><FaultToggle label="Excessive backlash" active={faults.backlash} onChange={() => setFaults(f => ({ ...f, backlash: !f.backlash }))} /><FaultToggle label="Motor saturation" active={faults.motor} onChange={() => setFaults(f => ({ ...f, motor: !f.motor }))} /><FaultToggle label="Wind disturbance" active={faults.wind} onChange={() => setFaults(f => ({ ...f, wind: !f.wind }))} /><FaultToggle label="Feedback delay" active={faults.delay} onChange={() => setFaults(f => ({ ...f, delay: !f.delay }))} /><FaultToggle label="Watchdog timeout" active={faults.watchdog} onChange={() => setFaults(f => ({ ...f, watchdog: !f.watchdog }))} /></Panel><Panel title="SAFETY STATE" icon={<ShieldCheck size={15} />}><div className={`safety-box ${sim.state.toLowerCase()}`}><ShieldCheck size={18} /><div><strong>{sim.state === 'SAFE' ? 'MOTORS DISABLED' : 'CONTROL ENABLED'}</strong><span>{sim.state === 'SAFE' ? 'Reset required to re-enable drive' : 'Limits and watchdog nominal'}</span></div></div></Panel><Panel title="EVENT LOG" icon={<Zap size={15} />}><div className="event-log">{sim.events.map((e, i) => <div key={`${e}-${i}`}><time>{fmt(sim.time - i * .8, 1).padStart(5, '0')}s</time><span>{e}</span></div>)}</div></Panel></aside></div>
    <footer className="footer-note"><span><Wind size={13} /> Simplified electromechanical model · SI internally · angles displayed in degrees</span><span>v0.1 / portfolio demonstrator</span></footer>
  </main>
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) { return <section className="panel"><div className="panel-title">{icon}<span>{title}</span></div>{children}</section> }
function Range({ label, value, min, max, step = 1, unit = '', onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) { return <label className="range-field"><span><em>{label}</em><b>{fmt(value, step < 1 ? 2 : 0)}{unit}</b></span><input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} /></label> }
function HealthRow({ name, value }: { name: string; value: number }) { const v = clamp(value, 0, 100); return <div className="health-row"><div><span>{name}</span><b>{fmt(v, 0)}%</b></div><div className="health-track"><i className={v > 85 ? 'good' : v > 60 ? 'warn' : 'bad'} style={{ width: `${v}%` }} /></div></div> }
function FaultToggle({ label, active, onChange }: { label: string; active: boolean; onChange: () => void }) { return <button className={`fault-toggle ${active ? 'active' : ''}`} onClick={onChange}><span className="toggle-indicator" />{label}<small>{active ? 'ON' : 'OFF'}</small></button> }
function Chart({ title, data, paths }: { title: string; data: Sim['history']; paths: { key: keyof Sim['history'][number]; color: string; min: number; max: number }[] }) { return <section className="chart-card"><div className="chart-title"><span>{title}</span><span className="chart-legend">{paths.map(p => <i key={String(p.key)} style={{ background: p.color }} />)}</span></div><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="chart-svg"><path d="M0 50H100 M0 25H100 M0 75H100" stroke="#244151" strokeWidth=".5" />{paths.map(p => <path key={String(p.key)} d={data.map((d, i) => `${i ? 'L' : 'M'} ${(i / Math.max(1, data.length - 1)) * 100} ${100 - ((Number(d[p.key]) - p.min) / (p.max - p.min)) * 100}`).join(' ')} fill="none" stroke={p.color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />)}</svg><div className="chart-axis"><span>−90 s</span><span>NOW</span></div></section> }
