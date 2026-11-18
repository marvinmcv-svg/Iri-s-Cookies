import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Reveal from './Reveal'
import { WaIcon } from './Brand'
import { FLAVOURS, EXTRAS, BOX_SIZES, PREMIUM_UPCHARGE, WINDOWS, WHATSAPP, nextDays, flavourById, extraById } from '../data'

const STEPS = ['Qué buscas', 'Detalles', 'Tus datos', 'Enviar']
const KINDS = [
  { id: 'caja', t: 'Una caja de cookies', d: 'De 6 u 12, con los sabores que quieras' },
  { id: 'extras', t: 'Cookie Pie o Bake your own', d: 'Para compartir, para hornear en casa o Fit' },
  { id: 'evento', t: 'El carrito para mi evento', d: 'Cumpleaños, bodas, baby showers o empresa' },
  { id: 'consulta', t: 'Tengo una consulta', d: 'Delivery, pagos, ingredientes o lo que necesites' },
]
const EVENT_TYPES = ['Cumpleaños', 'Boda', 'Baby shower', 'Empresa', 'Otro']
const TOPICS = ['Delivery', 'Pagos', 'Ingredientes / alergias', 'Pedido grande', 'Otro']
const GREETING = '¡Hola! 👋 Soy Iri de IriCookies. Cuéntanos qué se te antoja y te respondemos al toque 🍪'

const hhmm = () => new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: false })
const todayISO = () => new Date().toISOString().slice(0, 10)

/* WhatsApp *bold* → <b> for the phone preview */
function WaText({ text }) {
  return text.split('\n').map((ln, i) => (
    <span key={i} className="wb-ln">{ln.split(/(\*[^*]+\*)/g).map((p, k) => (p.startsWith('*') && p.endsWith('*') && p.length > 2 ? <b key={k}>{p.slice(1, -1)}</b> : p))}{'​'}</span>
  ))
}

export default function WaBooking() {
  const days = useMemo(() => nextDays(7), [])
  const [step, setStep] = useState(0)
  const [kind, setKind] = useState(null)
  const [box, setBox] = useState({ size: 6, flavours: [], surprise: false })
  const [extras, setExtras] = useState({})
  const [ev, setEv] = useState({ type: '', date: '', guests: '', place: '' })
  const [q, setQ] = useState({ topic: '', text: '' })
  const [me, setMe] = useState({ name: '', mode: 'pickup', zone: '', day: 1, window: WINDOWS[1] })
  const [touched, setTouched] = useState(false)
  const [sent, setSent] = useState(false)
  const [typing, setTyping] = useState(false)
  const chatRef = useRef(null)
  const time = useMemo(hhmm, [])

  // Other sections (e.g. the events card) can open the booking pre-filled.
  useEffect(() => {
    const on = (e) => { setKind(e.detail); setStep(1); setTouched(false); setSent(false) }
    window.addEventListener('iri-book', on)
    return () => window.removeEventListener('iri-book', on)
  }, [])

  const needsDelivery = kind === 'caja' || kind === 'extras'
  const premiumCount = box.flavours.filter((id) => flavourById[id]?.premium).length
  const boxBase = BOX_SIZES.find((s) => s.size === box.size).price
  const extrasList = Object.entries(extras).filter(([, n]) => n > 0)
  const extrasTotal = extrasList.reduce((s, [id, n]) => s + extraById[id].price * n, 0)

  const detailsOk =
    kind === 'caja' ? box.surprise || box.flavours.length > 0
      : kind === 'extras' ? extrasList.length > 0
        : kind === 'evento' ? !!ev.type && !!ev.date
          : kind === 'consulta' ? q.text.trim().length >= 3 : false
  const dataOk = me.name.trim().length >= 2 && (!needsDelivery || me.mode === 'pickup' || me.zone.trim().length >= 3)
  const canGo = [!!kind, detailsOk, dataOk, true]

  const message = useMemo(() => {
    const L = ['¡Hola IriCookies! 👋']
    if (!kind) return L[0]
    if (kind === 'caja') {
      L.push('', `Quiero una *caja de ${box.size}* 🍪`)
      if (box.surprise) L.push('Sabores: *sorpréndanme* 🎁')
      else if (box.flavours.length) L.push('Sabores: ' + box.flavours.map((id) => flavourById[id].name).join(', '))
      L.push(`Precio base: ${boxBase} Bs${premiumCount ? ` (+${PREMIUM_UPCHARGE} Bs por cada premium)` : ''}`)
    }
    if (kind === 'extras') {
      L.push('', 'Quiero pedir:')
      extrasList.forEach(([id, n]) => L.push(`• ${n}× ${extraById[id].name}`))
      if (extrasList.length) L.push(`Total: ${extrasTotal} Bs`)
    }
    if (kind === 'evento') {
      L.push('', 'Quiero cotizar el *carrito para mi evento* 🎉')
      if (ev.type) L.push(`Tipo: ${ev.type}`)
      if (ev.date) L.push(`Fecha: ${new Date(ev.date + 'T12:00').toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' })}`)
      if (ev.guests) L.push(`Invitados: ~${ev.guests}`)
      if (ev.place) L.push(`Lugar: ${ev.place}`)
    }
    if (kind === 'consulta') {
      L.push('', `Tengo una consulta${q.topic ? ` sobre *${q.topic.toLowerCase()}*` : ''}:`)
      if (q.text.trim()) L.push(q.text.trim())
    }
    if (step >= 2 || dataOk) {
      if (needsDelivery) {
        L.push('', `*${me.mode === 'pickup' ? 'Pickup' : 'Delivery'}* · ${days[me.day].long} · ${me.window}`)
        if (me.mode === 'delivery' && me.zone.trim()) L.push(`Zona: ${me.zone.trim()}`)
      }
      if (me.name.trim()) L.push('', `Soy ${me.name.trim()} 😊`)
    }
    return L.join('\n')
  }, [kind, box, extrasList, extrasTotal, ev, q, me, step, dataOk, needsDelivery, days, boxBase, premiumCount])

  // little "escribiendo…" flash while the message changes
  useEffect(() => {
    if (!kind) return
    setTyping(true)
    const t = setTimeout(() => setTyping(false), 450)
    return () => clearTimeout(t)
  }, [message, kind])
  useEffect(() => { const el = chatRef.current; if (el) el.scrollTop = el.scrollHeight }, [message, typing, sent])

  const waUrl = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`
  const go = (n) => { if (n <= step || canGo.slice(0, n).every(Boolean)) { setStep(n); setTouched(false) } else setTouched(true) }
  const next = () => (canGo[step] ? (setStep(step + 1), setTouched(false)) : setTouched(true))
  const send = () => {
    if (!canGo.slice(0, 3).every(Boolean)) { setTouched(true); return }
    window.open(waUrl, '_blank', 'noopener')
    setSent(true)
  }
  const pick = (id) => { setKind(id); setStep(1); setTouched(false); setSent(false) }
  const toggleFlavour = (id) => setBox((b) => ({ ...b, surprise: false, flavours: b.flavours.includes(id) ? b.flavours.filter((x) => x !== id) : [...b.flavours, id] }))
  const reset = () => { setStep(0); setKind(null); setSent(false); setTouched(false) }

  return (
    <section className="wb" id="pedir">
      <div className="wrap">
        <div className="wb-head">
          <Reveal><p className="kicker">Pide por WhatsApp</p></Reveal>
          <Reveal><h2 className="display">Tu pedido, <span className="serif accent-soft">en 4 toques.</span></h2></Reveal>
          <Reveal delay={0.1}><p className="lede">Elige, completa y te armamos el mensaje. Tú solo le das a enviar — te respondemos en minutos.</p></Reveal>
        </div>

        <div className="wb-grid">
          <div className="wb-form">
            <ol className="wb-steps" aria-label="Pasos">
              {STEPS.map((s, i) => (
                <li key={s} className={(i === step ? 'on ' : '') + (i < step ? 'done' : '')}>
                  <button onClick={() => go(i)} aria-current={i === step ? 'step' : undefined}><i /><span>{String(i + 1).padStart(2, '0')}<em> · {s}</em></span></button>
                </li>
              ))}
            </ol>

            <AnimatePresence mode="wait">
              <motion.div key={step + (kind || '')} className="wb-body" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.28 }}>
                {step === 0 && (
                  <div className="wb-kinds">
                    {KINDS.map((k, i) => (
                      <button key={k.id} className={'wb-kind' + (kind === k.id ? ' on' : '')} onClick={() => pick(k.id)}>
                        <small>{String(i + 1).padStart(2, '0')}</small><strong>{k.t}</strong><span>{k.d}</span>
                      </button>
                    ))}
                  </div>
                )}

                {step === 1 && kind === 'caja' && (
                  <div className="wb-fields">
                    <span className="wb-label">Tamaño</span>
                    <div className="wb-seg">
                      {BOX_SIZES.map((s) => (
                        <button key={s.size} className={box.size === s.size ? 'on' : ''} onClick={() => setBox((b) => ({ ...b, size: s.size }))}><b>{s.size}</b> cookies · {s.price} Bs</button>
                      ))}
                    </div>
                    <span className="wb-label">Sabores que te gustan <em>(los repartimos en tu caja)</em></span>
                    <div className="wb-chips">
                      <button className={'wb-chip surprise' + (box.surprise ? ' on' : '')} onClick={() => setBox((b) => ({ ...b, surprise: !b.surprise, flavours: [] }))}>🎁 Sorpréndanme</button>
                      {FLAVOURS.map((f) => (
                        <button key={f.id} className={'wb-chip' + (box.flavours.includes(f.id) ? ' on' : '')} onClick={() => toggleFlavour(f.id)} aria-pressed={box.flavours.includes(f.id)}>
                          <img src={f.img} alt="" loading="lazy" />{f.name}{f.premium && <em>+{PREMIUM_UPCHARGE}</em>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 1 && kind === 'extras' && (
                  <div className="wb-fields">
                    <span className="wb-label">¿Qué te llevas?</span>
                    <div className="wb-extras">
                      {EXTRAS.map((e) => {
                        const n = extras[e.id] || 0
                        return (
                          <div key={e.id} className={'wb-extra' + (n ? ' on' : '')}>
                            <img src={e.img} alt="" loading="lazy" />
                            <div><strong>{e.name}</strong><span>{e.price} Bs</span></div>
                            <div className="wb-step">
                              <button onClick={() => setExtras((x) => ({ ...x, [e.id]: Math.max(0, n - 1) }))} disabled={!n} aria-label={`Quitar ${e.name}`}>−</button>
                              <b>{n}</b>
                              <button onClick={() => setExtras((x) => ({ ...x, [e.id]: n + 1 }))} aria-label={`Agregar ${e.name}`}>+</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {step === 1 && kind === 'evento' && (
                  <div className="wb-fields">
                    <span className="wb-label">Tipo de evento</span>
                    <div className="wb-chips">{EVENT_TYPES.map((t) => <button key={t} className={'wb-chip' + (ev.type === t ? ' on' : '')} onClick={() => setEv((x) => ({ ...x, type: t }))}>{t}</button>)}</div>
                    <div className="wb-row">
                      <label className="wb-input"><span>Fecha</span><input type="date" min={todayISO()} value={ev.date} onChange={(e) => setEv((x) => ({ ...x, date: e.target.value }))} /></label>
                      <label className="wb-input"><span>Invitados (aprox.)</span><input inputMode="numeric" placeholder="50" value={ev.guests} onChange={(e) => setEv((x) => ({ ...x, guests: e.target.value.replace(/\D/g, '').slice(0, 5) }))} /></label>
                    </div>
                    <label className="wb-input"><span>Lugar o zona</span><input placeholder="Ej. Urubó, salón de eventos" value={ev.place} onChange={(e) => setEv((x) => ({ ...x, place: e.target.value }))} /></label>
                  </div>
                )}

                {step === 1 && kind === 'consulta' && (
                  <div className="wb-fields">
                    <span className="wb-label">Sobre qué</span>
                    <div className="wb-chips">{TOPICS.map((t) => <button key={t} className={'wb-chip' + (q.topic === t ? ' on' : '')} onClick={() => setQ((x) => ({ ...x, topic: x.topic === t ? '' : t }))}>{t}</button>)}</div>
                    <label className="wb-input"><span>Tu pregunta</span><textarea rows={3} placeholder="Escribe aquí tu consulta…" value={q.text} onChange={(e) => setQ((x) => ({ ...x, text: e.target.value }))} /></label>
                  </div>
                )}

                {step === 2 && (
                  <div className="wb-fields">
                    <label className="wb-input"><span>Tu nombre</span><input placeholder="¿Cómo te llamas?" autoComplete="given-name" value={me.name} onChange={(e) => setMe((x) => ({ ...x, name: e.target.value }))} /></label>
                    {needsDelivery && (
                      <>
                        <span className="wb-label">¿Cómo lo recibes?</span>
                        <div className="wb-seg">
                          <button className={me.mode === 'pickup' ? 'on' : ''} onClick={() => setMe((x) => ({ ...x, mode: 'pickup' }))}><b>Pickup</b> · gratis</button>
                          <button className={me.mode === 'delivery' ? 'on' : ''} onClick={() => setMe((x) => ({ ...x, mode: 'delivery' }))}><b>Delivery</b> · según zona</button>
                        </div>
                        {me.mode === 'delivery' && <label className="wb-input"><span>Zona o barrio</span><input placeholder="Ej. Equipetrol" value={me.zone} onChange={(e) => setMe((x) => ({ ...x, zone: e.target.value }))} /></label>}
                        <span className="wb-label">Día</span>
                        <div className="wb-days">
                          {days.map((d, i) => <button key={d.key} className={me.day === i ? 'on' : ''} onClick={() => setMe((x) => ({ ...x, day: i }))}><b>{d.num}</b><small>{d.dow}</small></button>)}
                        </div>
                        <span className="wb-label">Horario</span>
                        <div className="wb-chips">{WINDOWS.map((w) => <button key={w} className={'wb-chip' + (me.window === w ? ' on' : '')} onClick={() => setMe((x) => ({ ...x, window: w }))}>{w}</button>)}</div>
                      </>
                    )}
                  </div>
                )}

                {step === 3 && (
                  <div className="wb-fields wb-review">
                    <p>Así se verá tu mensaje. Al tocar <b>Enviar</b> se abre WhatsApp con todo listo — solo dale enviar.</p>
                    <button className="wb-send-big" onClick={send}><WaIcon size={20} /> Enviar por WhatsApp</button>
                    {sent && <p className="wb-sent" role="status">¡Listo! Si WhatsApp no se abrió, <a href={waUrl} target="_blank" rel="noreferrer">toca aquí</a>.</p>}
                    <button className="wb-link" onClick={reset}>Empezar otro pedido</button>
                  </div>
                )}

                {touched && !canGo[step] && (
                  <p className="wb-err" role="alert">
                    {step === 0 ? 'Elige una opción para seguir.'
                      : step === 1 ? (kind === 'caja' ? 'Elige al menos un sabor o “Sorpréndanme”.' : kind === 'extras' ? 'Agrega al menos un producto.' : kind === 'evento' ? 'Elige el tipo de evento y la fecha.' : 'Escribe tu consulta.')
                        : `Escribe tu nombre${needsDelivery && me.mode === 'delivery' ? ' y tu zona' : ''}.`}
                  </p>
                )}
                {step > 0 && step < 3 && (
                  <div className="wb-nav">
                    <button className="wb-link" onClick={() => setStep(step - 1)}>← Atrás</button>
                    <button className="wb-next" onClick={next}>{step === 2 ? 'Revisar mensaje' : 'Continuar'} →</button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <Reveal className="wb-phone-wrap">
            <div className="wb-phone" aria-label="Vista previa del mensaje de WhatsApp">
              <div className="wb-island" />
              <header className="wb-top">
                <span className="wb-back" aria-hidden="true">‹</span>
                <img src="/img/iri-chef.svg" alt="" />
                <div><strong>IriCookies</strong><small>{typing ? 'escribiendo…' : 'en línea'}</small></div>
                <span className="wb-dots" aria-hidden="true">⋮</span>
              </header>
              <div className="wb-chat" ref={chatRef}>
                <span className="wb-day">HOY</span>
                <div className="wb-msg in"><WaText text={GREETING} /><time>{time}</time></div>
                <motion.div layout className="wb-msg out" data-testid="wb-preview"><WaText text={message} /><time>{time} <span className={sent ? 'read' : ''}>✓✓</span></time></motion.div>
                {sent && <motion.div className="wb-msg in" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}><WaText text="¡Recibido! Te confirmamos en unos minutos 💕" /><time>{time}</time></motion.div>}
              </div>
              <footer className="wb-bar">
                <span className="wb-field">{step === 3 ? 'Listo para enviar' : 'Mensaje'}</span>
                <button className={'wb-send' + (step === 3 ? ' ready' : '')} onClick={step === 3 ? send : next} aria-label={step === 3 ? 'Enviar por WhatsApp' : 'Siguiente paso'}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.4 20.4 21 12 3.4 3.6 3.39 10.2 15 12 3.39 13.8z" /></svg>
                </button>
              </footer>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
