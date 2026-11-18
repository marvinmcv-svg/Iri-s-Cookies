import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import Reveal from './Reveal'
import { Pill } from './Brand'
import { WHATSAPP } from '../data'

export default function CartRental() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const x = useTransform(scrollYProgress, [0, 1], ['-18%', '10%'])
  const msg = encodeURIComponent('¡Hola IriCookies! Quiero cotizar el carrito para mi evento 🎉\nFecha:\nLugar:\nTipo de evento:')
  return (
    <section className="cart" id="eventos" ref={ref}>
      <motion.div className="cart-bigword" style={{ x }} aria-hidden="true">Eventos · Cumpleaños · Celebraciones ·</motion.div>
      <div className="cart-inner wrap">
        <Reveal className="cart-img"><img src="/img/cart.webp" alt="Carrito de IriCookies" loading="lazy" /></Reveal>
        <div className="cart-copy">
          <Reveal><p className="kicker">Nuevo · Alquila el carrito</p></Reveal>
          <Reveal><h2 className="display">Tu evento,<br /><span className="serif accent">junto a Iri.</span></h2></Reveal>
          <Reveal delay={0.1}><p className="lede">El carrito de IriCookies llega a tu cumpleaños, boda, baby shower o evento de empresa — lleno de cookies recién horneadas. Cuéntanos la fecha, el lugar y el tipo de evento y te cotizamos.</p></Reveal>
          <Reveal delay={0.15}><Pill href={`https://wa.me/${WHATSAPP}?text=${msg}`} variant="dark">Cotizar por WhatsApp</Pill></Reveal>
        </div>
      </div>
    </section>
  )
}
