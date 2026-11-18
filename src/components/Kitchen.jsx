import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'motion/react'
import { loadOrders, saveOrders, seedOrders, randomOrder } from '../store'
import { flavourById, extraById, FLAVOURS } from '../data'
import { Wordmark } from './Brand'

const COLS = [
  { k: 'new', t: 'Nuevos', s: 'Recién llegados', next: 'baking', cta: 'Empezar a hornear' },
  { k: 'baking', t: 'Horneando', s: 'En el horno', next: 'ready', cta: 'Marcar listo' },
  { k: 'ready', t: 'Listos', s: 'Empacados', next: 'done', cta: 'Entregado' },
]
const ago = (t) => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'ahora' : m < 60 ? `hace ${m} min` : `hace ${Math.floor(m / 60)} h` }

export default function Kitchen() {
  const [orders, setOrders] = useState(() => loadOrders() || seedOrders())
  const [tab, setTab] = useState('board')
  const [toast, setToast] = useState('')
  const [, tick] = useState(0)

  useEffect(() => {
    document.title = 'Kitchen · IriCookies'
    const sync = () => setOrders(loadOrders() || [])
    window.addEventListener('storage', sync); window.addEventListener('iri-orders', sync)
    const t = setInterval(() => tick((x) => x + 1), 30000)
    return () => { window.removeEventListener('storage', sync); window.removeEventListener('iri-orders', sync); clearInterval(t) }
  }, [])

  const move = (code, status) => {
    const o = orders.map((x) => (x.code === code ? { ...x, status } : x))
    saveOrders(o); setOrders(o)
    if (status === 'done') { const n = orders.find((x) => x.code === code); flash(`${code} entregado a ${n?.name}`) }
  }
  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 2600) }
  const simulate = () => { const o = [randomOrder('new', 0), ...orders]; saveOrders(o); setOrders(o); flash('Nuevo pedido recibido 🍪') }
  const reset = () => setOrders(seedOrders())

  const open = orders.filter((o) => o.status !== 'done')
  const toBake = orders.filter((o) => o.status === 'new' || o.status === 'baking').reduce((s, o) => s + o.items.length, 0)
  const handed = orders.filter((o) => o.status === 'done').length
  const takings = orders.reduce((s, o) => s + o.total, 0)
  const bake = useMemo(() => {
    const m = {}; orders.filter((o) => o.status === 'new' || o.status === 'baking').forEach((o) => o.items.forEach((id) => (m[id] = (m[id] || 0) + 1)))
    return FLAVOURS.map((f) => ({ f, n: m[f.id] || 0 })).sort((a, b) => b.n - a.n)
  }, [orders])
  const maxBake = Math.max(1, ...bake.map((x) => x.n))
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="kb">
      <aside className="kb-side">
        <a href="/" className="kb-logo"><Wordmark /></a>
        <small>Kitchen</small>
        <nav>
          <button className={tab === 'board' ? 'on' : ''} onClick={() => setTab('board')}>Tablero <b>{open.length}</b></button>
          <button className={tab === 'bake' ? 'on' : ''} onClick={() => setTab('bake')}>Lista de horneado</button>
        </nav>
        <div className="kb-side-foot">
          <span className="kb-live"><i /> Recibiendo pedidos</span>
          <button className="kb-sim" onClick={simulate}>+ Simular pedido</button>
          <button className="kb-reset" onClick={reset}>Reiniciar demo</button>
          <p>Demo: los pedidos se guardan en este navegador y se sincronizan entre pestañas.</p>
        </div>
      </aside>

      <main className="kb-main">
        <header className="kb-head">
          <div>
            <small>{new Date().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' })}</small>
            <h1>{greet}, cocina.</h1>
          </div>
          <span className="kb-clock">{new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}</span>
        </header>
        <div className="kb-stats">
          <div><small>Pedidos abiertos</small><b>{open.length}</b></div>
          <div><small>Cookies por hornear</small><b>{toBake}</b></div>
          <div><small>Entregados</small><b>{handed}</b></div>
          <div className="hot"><small>Vendido hoy</small><b>{takings} Bs</b></div>
        </div>

        {tab === 'board' ? (
          <LayoutGroup>
            <div className="kb-cols">
              {COLS.map((c) => {
                const list = orders.filter((o) => o.status === c.k)
                return (
                  <section key={c.k} className="kb-col">
                    <header><h2>{c.t} <span>{list.length}</span></h2><small>{c.s}</small></header>
                    <AnimatePresence>
                      {list.map((o) => (
                        <motion.article layout layoutId={o.code} key={o.code} className={'kb-card' + (o.demo ? '' : ' real')}
                          initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
                          <div className="kb-card-top"><b>{o.name}</b><small>{ago(o.createdAt)}</small></div>
                          <small className="kb-code">{o.code}{!o.demo && ' · web'}</small>
                          <div className="kb-dots">{o.items.map((id, i) => <img key={i} src={flavourById[id]?.img} alt={flavourById[id]?.name} title={flavourById[id]?.name} />)}</div>
                          {Object.entries(o.extras || {}).map(([id, q]) => <div key={id} className="kb-extra">+ {q}× {extraById[id]?.name}</div>)}
                          <div className="kb-meta"><span className={'kb-mode ' + o.mode}>{o.mode === 'pickup' ? 'Pickup' : 'Delivery'}</span><span>{o.day}, {o.window}</span></div>
                          {o.note && <p className="kb-note">“{o.note}”</p>}
                          <div className="kb-card-foot"><b>{o.total} Bs</b><button onClick={() => move(o.code, c.next)}>{c.cta} →</button></div>
                        </motion.article>
                      ))}
                    </AnimatePresence>
                    {!list.length && <p className="kb-empty">Nada por aquí.</p>}
                  </section>
                )
              })}
            </div>
          </LayoutGroup>
        ) : (
          <section className="kb-bake">
            <h2>Para hornear ahora</h2>
            {bake.map(({ f, n }) => (
              <div key={f.id} className="kb-bar">
                <img src={f.img} alt="" /><span>{f.name}</span>
                <div className="kb-bar-track"><motion.i initial={{ width: 0 }} animate={{ width: `${(n / maxBake) * 100}%` }} /></div>
                <b>{n}</b>
              </div>
            ))}
          </section>
        )}
      </main>
      <AnimatePresence>{toast && <motion.div className="kb-toast" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>{toast}</motion.div>}</AnimatePresence>
    </div>
  )
}
