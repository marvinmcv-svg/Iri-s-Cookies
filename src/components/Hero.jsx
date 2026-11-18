import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { Pill } from './Brand'

const line = { hidden: { y: '110%' }, show: (i) => ({ y: '0%', transition: { duration: 1, delay: 0.15 + i * 0.12, ease: [0.2, 0.75, 0.1, 1] } }) }

export default function Hero() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const yMain = useTransform(scrollYProgress, [0, 1], [0, 140])
  const rMain = useTransform(scrollYProgress, [0, 1], [0, 40])
  const yA = useTransform(scrollYProgress, [0, 1], [0, -220])
  const yB = useTransform(scrollYProgress, [0, 1], [0, -320])
  const yC = useTransform(scrollYProgress, [0, 1], [0, -160])
  const textY = useTransform(scrollYProgress, [0, 1], [0, 120])
  const textO = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  return (
    <section className="hero" id="top" ref={ref}>
      <motion.div className="hero-copy" style={{ y: textY, opacity: textO }}>
        <motion.p className="eyebrow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <span className="dot-live" /> Horneadas a mano · Santa Cruz, Bolivia
        </motion.p>
        <h1 className="hero-title">
          <span className="line"><motion.span custom={0} variants={line} initial="hidden" animate="show">Cookies with</motion.span></span>
          <span className="line"><motion.span custom={1} variants={line} initial="hidden" animate="show" className="serif accent">good fillings.</motion.span></span>
        </h1>
        <motion.div className="hero-sub" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8 }}>
          <p>Cookies gigantes y rellenas, horneadas el día que eliges. Arma tu caja, elige pickup o delivery y listo.</p>
          <Pill href="#build">Arma tu caja</Pill>
        </motion.div>
      </motion.div>

      <div className="hero-stage" aria-hidden="true">
        <div className="hero-plate" />
        <motion.img src="/img/cookies-cream.webp" alt="" className="hc hc-main" style={{ y: yMain, rotate: rMain }}
          initial={{ y: 200, opacity: 0, rotate: -30 }} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ duration: 1.4, delay: 0.3, ease: [0.2, 0.75, 0.1, 1] }} />
        <motion.div className="hc-wrap hc-a" style={{ y: yA }}><motion.img src="/img/biscoff.webp" alt="" className="hc float-1" initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 90, damping: 14, delay: 0.7 }} /></motion.div>
        <motion.div className="hc-wrap hc-b" style={{ y: yB }}><motion.img src="/img/nutella.webp" alt="" className="hc float-2" initial={{ scale: 0, rotate: 40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 90, damping: 14, delay: 0.85 }} /></motion.div>
        <motion.div className="hc-wrap hc-c" style={{ y: yC }}><motion.img src="/img/salted-caramel.webp" alt="" className="hc float-3" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 90, damping: 14, delay: 1 }} /></motion.div>
        <motion.div className="hc-wrap hc-d" style={{ y: yA }}><motion.img src="/img/double-chocolate.webp" alt="" className="hc float-2" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 90, damping: 14, delay: 1.1 }} /></motion.div>
        {[...Array(9)].map((_, i) => <span key={i} className={'crumb crumb-' + i} />)}
      </div>

      <motion.a href="#shop" className="hero-badge" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.2 }}>
        <svg viewBox="0 0 120 120" className="spin"><defs><path id="c" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" /></defs>
          <text><textPath href="#c" textLength="285" lengthAdjust="spacing">6 POR 87 Bs · TODOS LOS DÍAS · GOOD FILLINGS ·</textPath></text></svg>
        <span className="mask mark" />
      </motion.a>
    </section>
  )
}
