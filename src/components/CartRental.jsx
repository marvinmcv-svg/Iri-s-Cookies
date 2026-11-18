import Reveal from './Reveal'
import { Pill } from './Brand'

const TAGS = ['Cumpleaños', 'Bodas', 'Baby showers', 'Empresas']

export const openBooking = (kind) => {
  window.dispatchEvent(new CustomEvent('iri-book', { detail: kind }))
  document.getElementById('pedir')?.scrollIntoView({ behavior: 'smooth' })
}

export default function CartRental() {
  return (
    <section className="cart wrap" id="eventos">
      <div className="cart-card">
        <Reveal className="cart-img"><img src="/img/cart.webp" alt="El carrito de IriCookies lleno de cookies" loading="lazy" /></Reveal>
        <div className="cart-copy">
          <Reveal><p className="kicker">Nuevo · Alquila el carrito</p></Reveal>
          <Reveal><h2 className="display">Tu evento,<br /><span className="serif accent">junto a Iri.</span></h2></Reveal>
          <Reveal delay={0.1}><p className="lede">Llevamos el carrito lleno de cookies recién horneadas a tu celebración. Cuéntanos la fecha y el lugar, y te cotizamos.</p></Reveal>
          <Reveal delay={0.12}><ul className="cart-tags">{TAGS.map((t) => <li key={t}>{t}</li>)}</ul></Reveal>
          <Reveal delay={0.15}><Pill onClick={() => openBooking('evento')} variant="dark">Cotizar mi evento</Pill></Reveal>
        </div>
      </div>
    </section>
  )
}
