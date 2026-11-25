import { motion, AnimatePresence } from 'motion/react'
import { FLAVOURS, BOX_SIZES, PREMIUM_UPCHARGE, extraById, flavourById } from '../data'
import { useBag } from '../store'
import Reveal from './Reveal'
import { Arrow } from './Brand'

export default function Builder() {
  const b = useBag()
  const { bag, full } = b
  const counts = bag.items.reduce((m, id) => ((m[id] = (m[id] || 0) + 1), m), {})
  const left = bag.size - bag.items.length
  const extras = Object.entries(bag.extras).filter(([, q]) => q > 0)

  return (
    <section className="build wrap" id="build">
      <div className="build-head">
        <Reveal><p className="kicker">A tu gusto</p></Reveal>
        <Reveal><h2 className="display">Arma tu <span className="serif accent">caja.</span></h2></Reveal>
        <Reveal delay={0.1}><p className="lede">Elige el tamaño y toca los sabores para llenarla. Repite tus favoritos o toca «Sorpréndeme». Tocar una cookie de la caja la quita.</p></Reveal>
      </div>

      <div className="build-grid">
        <aside className="build-panel">
          <div className="seg" role="radiogroup" aria-label="Tamaño de caja">
            {BOX_SIZES.map((s) => (
              <button key={s.size} role="radio" aria-checked={bag.size === s.size} className={bag.size === s.size ? 'on' : ''} onClick={() => b.setSize(s.size)}>
                {bag.size === s.size && <motion.i layoutId="seg" className="seg-bg" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                <b>{s.size}</b><small>{s.price} Bs</small>
              </button>
            ))}
          </div>

          <div className={'slots slots-' + bag.size}>
            {Array.from({ length: bag.size }).map((_, i) => {
              const id = bag.items[i]
              return (
                <div key={i} className="slot">
                  <AnimatePresence>
                    {id && (
                      <motion.button key={id + i} className="slot-cookie" onClick={() => b.removeAt(i)} aria-label={`Quitar ${flavourById[id].name}`}
                        initial={{ scale: 0, rotate: -90, y: -40 }} animate={{ scale: 1, rotate: 0, y: 0 }} exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 18 }}>
                        <img src={flavourById[id].img} alt="" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>

          <div className="panel-status">
            <span>{full ? '¡Caja completa!' : left === bag.size ? `Elige ${bag.size} cookies` : `Faltan ${left}`}</span>
            <span className="panel-actions">
              {!full && <button onClick={b.surprise}>Sorpréndeme</button>}
              {bag.items.length > 0 && <button onClick={b.clear}>Vaciar</button>}
            </span>
          </div>

          {extras.length > 0 && (
            <ul className="panel-extras">
              {extras.map(([id, q]) => <li key={id}><span>{q}× {extraById[id].name}</span><span>{q * extraById[id].price} Bs</span></li>)}
            </ul>
          )}

          <div className="panel-total">
            <div><small>Total</small><motion.b key={b.boxTotal + b.extrasTotal} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>{(bag.items.length ? b.boxTotal : 0) + b.extrasTotal} Bs</motion.b></div>
            <button className="pill pill-pink" disabled={!b.canCheckout} onClick={() => b.setCheckoutOpen(true)}>
              <span>{b.canCheckout ? 'Continuar' : `Faltan ${left}`}</span><i className="pill-dot"><Arrow /></i>
            </button>
          </div>
          <p className="panel-note">Premium (Biscoff, Nutella) +{PREMIUM_UPCHARGE} Bs c/u. Delivery según zona.</p>
        </aside>

        <div className="build-list">
          {FLAVOURS.map((f, i) => {
            const n = counts[f.id] || 0
            return (
              <Reveal key={f.id} delay={(i % 3) * 0.06} className={'fcard' + (n ? ' has' : '')}>
                <button className="fcard-img" onClick={() => b.add(f.id)} disabled={full} aria-label={`Agregar ${f.name}`} style={{ '--tint': f.bg }}>
                  <img src={f.img} alt="" loading="lazy" className={f.small ? 'is-small' : ''} />
                  {f.premium && <span className="fcard-tag">Premium +{PREMIUM_UPCHARGE}</span>}
                </button>
                <div className="fcard-body">
                  <h3>{f.name}</h3>
                  <p>{f.desc}</p>
                </div>
                <div className="fcard-foot">
                  <div className="stepper">
                    <button onClick={() => b.removeOne(f.id)} disabled={!n} aria-label={`Quitar ${f.name}`}>−</button>
                    <motion.span key={n} initial={{ scale: 1.5 }} animate={{ scale: 1 }}>{n}</motion.span>
                    <button onClick={() => b.add(f.id)} disabled={full} aria-label={`Agregar ${f.name}`}>+</button>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
