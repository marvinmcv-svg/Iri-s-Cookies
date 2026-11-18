import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { FLAVOURS } from '../data'

const days = ['Hoy', 'Mañana', 'Vie', 'Sáb', 'Dom']

const Cards = [
  { k: '01', t: 'Arma tu caja', d: 'Elige 6 o 12 y llénala con tus sabores. Mezcla todo lo que quieras.', cls: 'c-pink', art: <img src="/img/scatter.webp" alt="" className="hw-photo-cut" loading="lazy" /> },
  {
    k: '02', t: 'Elige día y hora', d: 'Pickup o delivery, el día y la franja que te queden mejor.', cls: 'c-cream',
    art: (
      <div className="mock mock-days">
        <div className="mock-seg"><b>Pickup</b><span>Delivery</span></div>
        <div className="mock-chips">{days.map((d, i) => <span key={d} className={i === 2 ? 'on' : ''}><b>{20 + i}</b>{d}</span>)}</div>
        <div className="mock-win"><span>10 – 12</span><span className="on">14 – 16</span></div>
      </div>
    ),
  },
  {
    k: '03', t: 'Llega a la cocina', d: 'Tu pedido aterriza en nuestro tablero y te confirmamos por WhatsApp.', cls: 'c-white',
    art: (
      <div className="mock mock-order">
        <div className="mock-row"><b>IC-2048</b><span className="tag">Nuevo</span></div>
        <div className="mock-name">Valentina · Caja de 6</div>
        <div className="mock-dots">{FLAVOURS.slice(0, 6).map((f) => <i key={f.id} style={{ background: f.dot }} />)}</div>
        <div className="mock-row small"><span>Pickup · 14:00 – 16:00</span><b>87 Bs</b></div>
      </div>
    ),
  },
  { k: '04', t: 'Horneadas ese día', d: 'Nada de stock de ayer: horneamos el día de tu pedido.', cls: 'c-photo', art: <img src="/img/oven.webp" alt="Cookies horneándose en el horno de IriCookies" className="hw-photo" loading="lazy" /> },
  { k: '05', t: 'Listas para ti', d: 'Empacadas a mano, para recoger o directo a tu puerta.', cls: 'c-hot', art: <img src="/img/hero-trio.webp" alt="Cookies IriCookies listas" className="hw-photo-cut wide" loading="lazy" /> },
]

export default function HowItWorks() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const x = useTransform(scrollYProgress, [0.05, 0.95], ['0%', '-62%'])
  const bar = useTransform(scrollYProgress, [0.05, 0.95], ['0%', '100%'])
  return (
    <section className="how" id="como" ref={ref}>
      <div className="how-sticky">
        <div className="how-head wrap">
          <p className="kicker">Cómo funciona</p>
          <h2 className="display">De un toque<br /><span className="serif accent">a tu puerta.</span></h2>
          <div className="how-bar"><motion.i style={{ width: bar }} /></div>
        </div>
        <motion.div className="how-track" style={{ x }}>
          {Cards.map((c) => (
            <article key={c.k} className={'how-card ' + c.cls}>
              <span className="how-k">{c.k}</span>
              <div className="how-art">{c.art}</div>
              <h3>{c.t}</h3>
              <p>{c.d}</p>
            </article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
