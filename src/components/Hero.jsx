import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { FLAVOURS, PREMIUM_UPCHARGE } from '../data'
import { useBag } from '../store'
import { Pill, WaIcon } from './Brand'

const N = FLAVOURS.length
const STEP = (Math.PI * 2) / N
const FRONT = Math.PI / 2 // angle where a cookie is closest to the viewer (bottom of the ellipse)
const CRUISE = 0.55 // rad/s auto-spin
const line = { hidden: { y: '110%' }, show: (i) => ({ y: '0%', transition: { duration: 1.1, delay: 0.25 + i * 0.12, ease: [0.2, 0.75, 0.1, 1] } }) }
const norm = (a) => ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)

/* Hero: Iri in her kitchen, with every flavour orbiting her in 3D — behind her, then in front
   of the tray. Drag/swipe to spin, tap a cookie to bring it to the front and add it to your box. */
export default function Hero() {
  const b = useBag()
  const stage = useRef(null)
  const arch = useRef(null)
  const orbit = useRef(null)
  const ring = useRef(null)
  const items = useRef([])
  const [front, setFront] = useState(0)
  const [added, setAdded] = useState(0)
  const st = useRef({ theta: FRONT, vel: 0, target: null, drag: null, hover: false, visible: true, geo: null, t0: 0, front: 0 })

  useEffect(() => {
    const s = st.current
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    s.t0 = performance.now() - (reduce ? 5000 : 0)

    const measure = () => {
      const el = stage.current, ar = arch.current; if (!el || !ar) return
      const sw = el.clientWidth
      const aw = ar.offsetWidth, ah = ar.offsetHeight
      const cx = sw / 2 // the arch is centred in the stage (CSS translate isn't in offsetLeft)
      const cy = ar.offsetTop + ah * 0.72
      const wide = sw > 520
      const size = Math.max(56, Math.min(aw * (wide ? 0.27 : 0.32), 150))
      const rx = wide ? Math.min(aw * 0.95, sw / 2 + 20) : Math.min(aw * 0.86, sw / 2 - size * 0.4)
      const ry = Math.max(30, ah * (wide ? 0.15 : 0.18))
      s.geo = { size, rx, ry }
      Object.assign(orbit.current.style, { left: cx + 'px', top: cy + 'px' })
      Object.assign(ring.current.style, { left: cx + 'px', top: cy + 'px', width: rx * 2 + 'px', height: ry * 2 + 'px' })
      items.current.forEach((n) => n && (n.style.width = size + 'px'))
    }
    measure()
    const ro = new ResizeObserver(measure); ro.observe(stage.current); ro.observe(arch.current)
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting }, { threshold: 0 })
    io.observe(stage.current)

    let raf, last = performance.now()
    const tick = (now) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      if (!s.visible || document.hidden || !s.geo) return
      const intro = Math.min(1, (now - s.t0) / 1500)
      const ease = 1 - Math.pow(1 - intro, 3)

      if (s.target != null) { // tap-to-front: ease towards target angle
        const d = s.target - s.theta
        s.theta += d * Math.min(1, dt * 7)
        if (Math.abs(d) < 0.002) { s.theta = s.target; s.target = null }
      } else if (!s.drag) {
        const cruise = reduce || s.hover || now < (s.hold || 0) ? 0 : CRUISE // pause while pointing / after a tap
        s.vel += (cruise - s.vel) * Math.min(1, dt * (cruise ? 1.8 : 6))
        s.theta += (s.vel + (1 - ease) * 3) * dt
      }

      const { size, rx, ry } = s.geo
      let best = 0, bestD = -2
      for (let i = 0; i < N; i++) {
        const el = items.current[i]; if (!el) continue
        const a = s.theta + i * STEP
        const depth = Math.sin(a) // 1 = front, -1 = back
        const k = (depth + 1) / 2
        const scale = (0.5 + 0.62 * k) * (0.3 + 0.7 * ease)
        const x = Math.cos(a) * rx * ease
        const y = depth * ry * ease
        el.style.transform = `translate3d(${x - size / 2}px, ${y - size / 2}px, 0) scale(${scale}) rotate(${(a * 57) % 360}deg)`
        el.style.zIndex = depth > 0 ? 4 : 1
        el.style.opacity = String(Math.min(1, ease * 2) * (0.5 + 0.5 * k))
        if (depth > bestD) { bestD = depth; best = i }
      }
      if (best !== s.front) { s.front = best; setFront(best) }
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect() }
  }, [])

  const bringToFront = (i) => {
    const s = st.current
    const want = FRONT - i * STEP
    s.target = s.theta + (norm(want - s.theta + Math.PI) - Math.PI)
    s.hold = performance.now() + 4000 // keep it in front long enough to add it
  }

  // drag / swipe to spin (horizontal); vertical swipes still scroll the page
  const onDown = (e) => { st.current.drag = { x: e.clientX, last: e.clientX, t: performance.now(), moved: false }; st.current.target = null }
  const onMove = (e) => {
    const d = st.current.drag; if (!d) return
    const dx = e.clientX - d.last
    if (Math.abs(e.clientX - d.x) > 6) d.moved = true
    const now = performance.now()
    st.current.theta += dx * 0.007
    st.current.vel = (dx * 0.007) / Math.max(0.008, (now - d.t) / 1000)
    d.last = e.clientX; d.t = now
  }
  const onUp = () => { const d = st.current.drag; st.current.drag = null; if (d?.moved) st.current.justDragged = performance.now() }
  const clickCookie = (i) => { if (performance.now() - (st.current.justDragged || 0) < 250) return; bringToFront(i) }

  const f = FLAVOURS[front]
  const addFront = () => { b.add(f.id); setAdded((n) => n + 1); st.current.hold = performance.now() + 2500 }

  return (
    <section className="hero" id="top">
      <div className="hero-glow" aria-hidden="true" />
      <div className="hero-grid wrap">
        <div className="hero-copy">
          <motion.p className="eyebrow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <span className="dot-live" /> Horneadas hoy · Santa Cruz, Bolivia
          </motion.p>
          <h1 className="hero-title">
            <span className="line"><motion.span custom={0} variants={line} initial="hidden" animate="show">Cookies with</motion.span></span>
            <span className="line"><motion.span custom={1} variants={line} initial="hidden" animate="show" className="serif">good fillings.</motion.span></span>
          </h1>
          <motion.div className="hero-after" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.8 }}>
            <p className="hero-lede">Gigantes, rellenas y horneadas a mano el día que eliges. <span>Gira los sabores y arma tu caja.</span></p>
            <div className="hero-ctas">
              <Pill href="#build" variant="pink">Arma tu caja</Pill>
              <a href="#pedir" className="hero-wa"><WaIcon size={18} /> <span className="hide-sm">Pedir por&nbsp;</span>WhatsApp</a>
            </div>
            <p className="hero-deal"><b>6 por 87 Bs</b><span>todos los días</span></p>
          </motion.div>
        </div>

        <div
          className="hero-stage" ref={stage}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
          onPointerLeave={(e) => { onUp(e); st.current.hover = false }} onPointerEnter={() => { st.current.hover = true }}
        >
          <div className="hero-ring" ref={ring} aria-hidden="true" />
          <motion.figure className="hero-arch" ref={arch} initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 1.1, delay: 0.2, ease: [0.2, 0.75, 0.1, 1] }}>
            <img src="/img/iri-kitchen.webp" alt="Iri, la chef de IriCookies, con una bandeja de cookies recién horneadas" fetchpriority="high" draggable="false" />
            <figcaption><img src="/img/iri-avatar.webp" alt="" /><span><b>Hola, soy Iri</b>Chef de IriCookies</span></figcaption>
          </motion.figure>
          <div className="hero-orbit" ref={orbit} role="group" aria-label="Nuestros sabores">
            {FLAVOURS.map((fl, i) => (
              <button key={fl.id} ref={(n) => (items.current[i] = n)} className="hero-cookie" onClick={() => clickCookie(i)}
                aria-label={`Ver ${fl.name}`} aria-pressed={front === i}>
                <img src={fl.img} alt="" draggable="false" />
              </button>
            ))}
          </div>
          <motion.div className="hero-now" key={f.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} aria-live="polite">
            <span className="hero-now-dot" style={{ background: f.dot }} />
            <span className="hero-now-name">{f.name}{f.premium && <em>Premium +{PREMIUM_UPCHARGE}</em>}</span>
            <button className="hero-now-add" onClick={addFront} disabled={b.full} aria-label={`Agregar ${f.name} a mi caja`}>
              <motion.span key={added} initial={{ scale: added ? 1.6 : 1 }} animate={{ scale: 1 }}>{b.full ? 'Caja llena' : '+ A mi caja'}</motion.span>
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
