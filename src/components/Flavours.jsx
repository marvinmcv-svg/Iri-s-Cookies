import { useRef, useState } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from 'motion/react'
import { FLAVOURS, COMING_SOON, PREMIUM_UPCHARGE } from '../data'
import { useBag } from '../store'

export default function Flavours() {
  const ref = useRef(null)
  const [idx, setIdx] = useState(0)
  const { add, full, bag } = useBag()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const spin = useTransform(scrollYProgress, [0, 1], [0, 540])
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const i = Math.min(FLAVOURS.length - 1, Math.max(0, Math.floor(p * FLAVOURS.length)))
    if (i !== idx) setIdx(i)
  })
  const f = FLAVOURS[idx]
  const inBox = bag.items.filter((x) => x === f.id).length
  const jump = (i) => {
    const el = ref.current; if (!el) return
    const top = el.offsetTop + (el.offsetHeight - window.innerHeight) * ((i + 0.5) / FLAVOURS.length)
    window.scrollTo({ top, behavior: 'smooth' })
  }
  return (
    <section className="flav" id="sabores" ref={ref} style={{ height: `${FLAVOURS.length * 50 + 60}vh` }}>
      <motion.div className={'flav-sticky' + (f.ink !== '#110c0e' ? ' is-dark' : '')} animate={{ backgroundColor: f.bg, color: f.ink }} transition={{ duration: 0.6 }}>
        <div className="flav-top wrap">
          <span className="kicker">Los sabores</span>
          <span className="flav-soon">Muy pronto: <b>{COMING_SOON.name}</b> — {COMING_SOON.desc}</span>
        </div>

        <div className="flav-name">
          <AnimatePresence mode="wait">
            <motion.h3 key={f.id} initial={{ y: 60, opacity: 0, filter: 'blur(8px)' }} animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }} exit={{ y: -60, opacity: 0, filter: 'blur(8px)' }} transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}>
              {f.name}
              {f.premium && <span className="flav-prem">Premium</span>}
            </motion.h3>
          </AnimatePresence>
        </div>

        <div className="flav-cookie">
          <AnimatePresence mode="popLayout">
            <motion.div key={f.id} className="flav-cookie-inner"
              initial={{ x: '60vw', rotate: 120, opacity: 0 }} animate={{ x: 0, rotate: 0, opacity: 1 }} exit={{ x: '-60vw', rotate: -120, opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.25, 0.7, 0.2, 1] }}>
              <motion.img src={f.img} alt={f.name} style={{ rotate: spin }} className={f.small ? 'is-small' : ''} />
            </motion.div>
          </AnimatePresence>
          <div className="flav-shadow" />
        </div>

        <div className="flav-info">
          <AnimatePresence mode="wait">
            <motion.div key={f.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }}>
              <p>{f.desc}</p>
              <p className="flav-price">{f.premium ? `20 Bs · +${PREMIUM_UPCHARGE} Bs en cajas` : '15 Bs · incluida en cajas'}</p>
              <button className="pill pill-ink" onClick={() => add(f.id)} disabled={full}>
                <span>{full ? 'Tu caja está llena' : inBox ? `Agregar otra (${inBox})` : 'Agregar a la caja'}</span><i className="pill-dot">+</i>
              </button>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flav-count"><b>{String(idx + 1).padStart(2, '0')}</b><span>/ {String(FLAVOURS.length).padStart(2, '0')}</span></div>
        <div className="flav-rail" aria-label="Ir a un sabor">
          {FLAVOURS.map((x, i) => <button key={x.id} aria-label={x.name} className={i === idx ? 'on' : ''} onClick={() => jump(i)} />)}
        </div>
      </motion.div>
    </section>
  )
}
