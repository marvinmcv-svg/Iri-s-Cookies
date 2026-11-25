import { motion } from 'motion/react'
import Reveal from './Reveal'
import { useBag } from '../store'
import { WHATSAPP, FLAVOURS, PREMIUM_UPCHARGE } from '../data'

const ITEMS = [
  { n: 1, title: 'La suelta', price: '15 Bs', sub: 'Una cookie, cero excusas.', img: '/img/chocolate-chip.webp', cls: 'single' },
  { n: 6, title: 'Caja de 6', price: '87 Bs', sub: 'El favorito. Para ti o para regalar.', cls: 'six' },
  { n: 12, title: 'Caja de 12', price: '168 Bs', sub: 'Para la oficina, el cumple o tú.', cls: 'twelve' },
]

export default function Boxes() {
  const { setSize } = useBag()
  const go = (n) => (e) => {
    if (n === 1) return
    e.preventDefault(); setSize(n)
    document.getElementById('build')?.scrollIntoView({ behavior: 'smooth' })
  }
  return (
    <section className="boxes wrap" id="shop">
      <Reveal><p className="kicker center">Las cajas</p></Reveal>
      <Reveal><h2 className="display center">Elige tu tamaño.</h2></Reveal>
      <div className="boxes-grid">
        {ITEMS.map((it, i) => (
          <Reveal key={it.n} delay={i * 0.1}>
            <motion.a href={it.n === 1 ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent('¡Hola IriCookies! Quiero pedir cookies sueltas 🍪')}` : '#build'}
              target={it.n === 1 ? '_blank' : undefined} rel="noreferrer"
              onClick={go(it.n)} className={'box-tile ' + it.cls} whileHover="hover">
              <span className="box-num">{it.n}</span>
              {it.img ? (
                <motion.img src={it.img} alt={it.title} loading="lazy" variants={{ hover: { y: -14, rotate: 25, scale: 1.04 } }} transition={{ type: 'spring', stiffness: 200, damping: 16 }} />
              ) : (
                <motion.div className={'box-spread s' + it.n} variants={{ hover: { y: -10 } }} transition={{ type: 'spring', stiffness: 200, damping: 16 }} aria-hidden="true">
                  {Array.from({ length: it.n }).map((_, k) => (
                    <motion.img key={k} src={FLAVOURS[(k * 5 + it.n) % FLAVOURS.length].img} alt="" loading="lazy"
                      variants={{ hover: { rotate: k % 2 ? 14 : -14, scale: 1.06 } }} transition={{ type: 'spring', stiffness: 260, damping: 14, delay: k * 0.015 }} />
                  ))}
                </motion.div>
              )}
              <div className="box-meta">
                <strong>{it.title}</strong>
                <span>{it.sub}</span>
                <em>{it.price}</em>
              </div>
            </motion.a>
          </Reveal>
        ))}
      </div>
      <Reveal><p className="boxes-note">Biscoff y Nutella son premium: +{PREMIUM_UPCHARGE} Bs por cookie en tu caja. Pickup gratis o delivery en Santa Cruz (se cotiza según tu zona).</p></Reveal>
    </section>
  )
}
