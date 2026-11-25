import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useBag, pushOrder, makeCode } from '../store'
import { windowsFor, nextDays, flavourById, extraById, WHATSAPP } from '../data'

const STEPS = ['¿Cómo lo quieres?', '¿Para quién es?', 'Revisa tu pedido']
const ME_KEY = 'iri.me.v1'
const loadMe = () => { try { return JSON.parse(localStorage.getItem(ME_KEY)) || {} } catch { return {} } }
const saveMe = ({ mode, name, phone, ig, address }) => { try { localStorage.setItem(ME_KEY, JSON.stringify({ mode, name, phone, ig, address })) } catch { /* private mode */ } }

function groupItems(items) {
  const m = {}; items.forEach((id) => (m[id] = (m[id] || 0) + 1)); return Object.entries(m)
}

export default function Checkout() {
  const b = useBag()
  const { bag, checkoutOpen: open, setCheckoutOpen } = b
  const days = useMemo(() => nextDays(6), [open])
  const firstDay = Math.max(0, days.findIndex((d) => d.offset === 1)) // default: tomorrow
  const [step, setStep] = useState(0)
  // Returning customers: their contact details are remembered on this device.
  const [f, setF] = useState(() => ({ mode: 'pickup', day: firstDay, window: '', name: '', phone: '', ig: '', address: '', note: '', ...loadMe() }))
  const [done, setDone] = useState(null)
  const [touched, setTouched] = useState(false)
  const dialog = useRef(null)
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e?.target ? e.target.value : e }))
  const wins = windowsFor(days[f.day]?.offset ?? 1)
  const win = wins.includes(f.window) ? f.window : wins[0]

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    setTimeout(() => dialog.current?.focus(), 50)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [open])

  const close = () => { setCheckoutOpen(false); setTimeout(() => { setStep(0); setDone(null); setTouched(false) }, 300) }
  const hasBox = bag.items.length === bag.size
  const extras = Object.entries(bag.extras).filter(([, q]) => q > 0)
  const total = (hasBox ? b.boxTotal : 0) + b.extrasTotal
  const step2ok = f.name.trim().length > 1 && f.phone.replace(/\D/g, '').length >= 7 && (f.mode === 'pickup' || f.address.trim().length > 3)

  const message = (code) => {
    const lines = [`¡Hola IriCookies! 🍪 Quiero hacer un pedido (${code})`, '']
    if (hasBox) {
      lines.push(`*Caja de ${bag.size}*`)
      groupItems(bag.items).forEach(([id, q]) => lines.push(`• ${q}× ${flavourById[id].name}`))
    }
    if (extras.length) { lines.push('', '*Extras*'); extras.forEach(([id, q]) => lines.push(`• ${q}× ${extraById[id].name}`)) }
    lines.push('', `*Entrega:* ${f.mode === 'pickup' ? 'Pickup' : 'Delivery'} · ${days[f.day].long} · ${win}`)
    if (f.mode === 'delivery') lines.push(`*Dirección:* ${f.address}`)
    lines.push(`*Nombre:* ${f.name}`, `*Contacto:* ${f.phone}${f.ig ? ' · ' + f.ig : ''}`)
    if (f.note) lines.push(`*Nota:* ${f.note}`)
    lines.push('', `*Total:* ${total} Bs${f.mode === 'delivery' ? ' + delivery' : ''}`)
    return lines.join('\n')
  }

  const submit = () => {
    const code = makeCode()
    const order = {
      code, name: f.name.trim(), contact: f.phone + (f.ig ? ' · ' + f.ig : ''), size: hasBox ? bag.size : 0, items: hasBox ? bag.items : [],
      extras: Object.fromEntries(extras), mode: f.mode, address: f.address, day: days[f.day].dow, window: win, note: f.note,
      total, status: 'new', createdAt: Date.now(),
    }
    pushOrder(order)
    saveMe(f)
    const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message(code))}`
    window.open(url, '_blank', 'noopener')
    setDone({ code, url, summary: order })
    b.clear()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="co-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && close()}>
          <motion.div className="co" role="dialog" aria-modal="true" aria-labelledby="co-title" tabIndex={-1} ref={dialog}
            initial={{ y: 60, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}>
            <button className="co-x" onClick={close} aria-label="Cerrar">×</button>

            {done ? (
              <div className="co-done">
                <motion.div className="co-done-badge" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 14 }}>
                  <span className="mask mark" />
                </motion.div>
                <p className="co-step">Pedido {done.code}</p>
                <h2 id="co-title">Último paso: envíalo.</h2>
                <p className="co-muted">Abrimos WhatsApp con tu pedido escrito. <b>Tu pedido cuenta cuando tocas enviar ahí</b>; te confirmamos hora y pago en minutos.</p>
                <a className="pill pill-dark block" href={done.url} target="_blank" rel="noreferrer"><span>¿No se abrió? Abrir WhatsApp</span><i className="pill-dot">→</i></a>
                <button className="co-link" onClick={close}>Seguir viendo</button>
              </div>
            ) : (
              <>
                <p className="co-step">Paso {step + 1} de 3</p>
                <h2 id="co-title">{STEPS[step]}</h2>
                <div className="co-progress"><motion.i animate={{ width: `${((step + 1) / 3) * 100}%` }} /></div>

                <AnimatePresence mode="wait">
                  <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
                    {step === 0 && (
                      <div className="co-body">
                        <div className="co-modes">
                          {[['pickup', 'Pickup', 'Gratis · te enviamos la ubicación'], ['delivery', 'Delivery', 'Santa Cruz · costo según zona']].map(([k, t, s]) => (
                            <button key={k} className={f.mode === k ? 'on' : ''} onClick={() => set('mode')(k)}><b>{t}</b><small>{s}</small></button>
                          ))}
                        </div>
                        <label className="co-label">¿Qué día?</label>
                        <div className="co-days">
                          {days.map((d, i) => (
                            <button key={d.key} className={f.day === i ? 'on' : ''} onClick={() => set('day')(i)} aria-pressed={f.day === i} aria-label={d.long}><b>{d.num}</b><small>{d.dow}</small></button>
                          ))}
                        </div>
                        <label className="co-label">{f.mode === 'pickup' ? 'Horario de pickup' : 'Horario de entrega'}</label>
                        <div className="co-wins">
                          {wins.map((w) => <button key={w} className={win === w ? 'on' : ''} onClick={() => set('window')(w)} aria-pressed={win === w}>{w}</button>)}
                        </div>
                        <button className="co-next" onClick={() => setStep(1)}>Continuar a tus datos</button>
                      </div>
                    )}
                    {step === 1 && (
                      <div className="co-body">
                        <label className="co-field"><span>Nombre *</span><input value={f.name} onChange={set('name')} placeholder="Tu nombre" autoComplete="name" /></label>
                        <label className="co-field"><span>WhatsApp *</span><input value={f.phone} onChange={set('phone')} placeholder="+591 7xx xxxxx" inputMode="tel" autoComplete="tel" /></label>
                        <label className="co-field"><span>Instagram (opcional)</span><input value={f.ig} onChange={set('ig')} placeholder="@tuusuario" /></label>
                        {f.mode === 'delivery' && <label className="co-field"><span>Dirección de entrega *</span><textarea rows={2} value={f.address} onChange={set('address')} placeholder="Barrio, calle, referencia" /></label>}
                        <label className="co-field"><span>Nota para la cocina</span><textarea rows={2} value={f.note} onChange={set('note')} placeholder="¿Es un regalo? ¿Un cumple? Cuéntanos." /></label>
                        {touched && !step2ok && <p className="co-err">Completa nombre, WhatsApp{f.mode === 'delivery' ? ' y dirección' : ''} para continuar.</p>}
                        <button className="co-next" onClick={() => (step2ok ? setStep(2) : setTouched(true))}>Revisar pedido</button>
                        <button className="co-link" onClick={() => setStep(0)}>Volver</button>
                      </div>
                    )}
                    {step === 2 && (
                      <div className="co-body">
                        <ul className="co-sum">
                          {hasBox && <li className="co-sum-h"><span>Caja de {bag.size}</span><span>{b.boxTotal} Bs</span></li>}
                          {hasBox && groupItems(bag.items).map(([id, q]) => (
                            <li key={id}><span><img src={flavourById[id].img} alt="" />{flavourById[id].name}</span><span>×{q}</span></li>
                          ))}
                          {extras.map(([id, q]) => <li key={id} className="co-sum-h"><span>{q}× {extraById[id].name}</span><span>{q * extraById[id].price} Bs</span></li>)}
                        </ul>
                        <p className="co-when">{f.mode === 'pickup' ? 'Pickup' : 'Delivery'} · <b>{days[f.day].long}</b> · {win}</p>
                        <div className="co-total"><span>Total</span><b>{total} Bs</b></div>
                        {f.mode === 'delivery' && <p className="co-muted small">+ costo de delivery según tu zona.</p>}
                        <p className="co-info">No cobramos nada aquí. Se abre WhatsApp con tu pedido escrito: lo envías, te confirmamos disponibilidad y coordinamos el pago.</p>
                        <button className="co-next pink" onClick={submit}>Enviar por WhatsApp</button>
                        <button className="co-link" onClick={() => setStep(1)}>Volver a tus datos</button>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
