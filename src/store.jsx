import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { boxPrice, extraById, flavourById, EXTRAS } from './data'

const BagCtx = createContext(null)
const BAG_KEY = 'iri.bag.v1'
const ORDERS_KEY = 'iri.orders.v1'

const load = (k, fallback) => {
  try { const v = JSON.parse(localStorage.getItem(k)); return v ?? fallback } catch { return fallback }
}

export function BagProvider({ children }) {
  const [bag, setBag] = useState(() => load(BAG_KEY, { size: 6, items: [], extras: {} }))
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [pulse, setPulse] = useState(0)

  useEffect(() => { localStorage.setItem(BAG_KEY, JSON.stringify(bag)) }, [bag])

  const full = bag.items.length >= bag.size
  const add = useCallback((id) => {
    setBag((b) => (b.items.length >= b.size ? b : { ...b, items: [...b.items, id] }))
    setPulse((p) => p + 1)
  }, [])
  const removeOne = useCallback((id) => setBag((b) => {
    const i = b.items.lastIndexOf(id); if (i < 0) return b
    const items = b.items.slice(); items.splice(i, 1); return { ...b, items }
  }), [])
  const removeAt = useCallback((idx) => setBag((b) => ({ ...b, items: b.items.filter((_, i) => i !== idx) })), [])
  const setSize = useCallback((size) => setBag((b) => ({ ...b, size, items: b.items.slice(0, size) })), [])
  const setExtra = useCallback((id, qty) => { setBag((b) => ({ ...b, extras: { ...b.extras, [id]: Math.max(0, qty) } })); setPulse((p) => p + 1) }, [])
  const surprise = useCallback(() => setBag((b) => {
    const pool = Object.keys(flavourById).filter((id) => !flavourById[id].premium)
    const items = b.items.slice()
    while (items.length < b.size) items.push(pool[Math.floor(Math.random() * pool.length)])
    return { ...b, items }
  }), [])
  const clear = useCallback(() => setBag((b) => ({ size: b.size, items: [], extras: {} })), [])

  const extrasTotal = EXTRAS.reduce((s, e) => s + (bag.extras[e.id] || 0) * e.price, 0)
  const extrasCount = Object.values(bag.extras).reduce((s, n) => s + n, 0)
  const boxTotal = bag.items.length ? boxPrice(bag.size, bag.items) : 0
  const total = (full ? boxTotal : 0) + extrasTotal
  const canCheckout = full || (bag.items.length === 0 && extrasCount > 0)
  const count = bag.items.length + extrasCount

  const value = useMemo(() => ({
    bag, add, removeOne, removeAt, setSize, setExtra, surprise, clear, full, total, boxTotal, extrasTotal, extrasCount, canCheckout, count,
    checkoutOpen, setCheckoutOpen, pulse,
  }), [bag, add, removeOne, removeAt, setSize, setExtra, surprise, clear, full, total, boxTotal, extrasTotal, extrasCount, canCheckout, count, checkoutOpen, pulse])
  return <BagCtx.Provider value={value}>{children}</BagCtx.Provider>
}
export const useBag = () => useContext(BagCtx)

/* ---------- Orders (kitchen board) ----------
   Orders are stored in this browser (localStorage) and sync live across tabs.
   Swap these functions for an API/database call to share the board across devices. */
export function loadOrders() { return load(ORDERS_KEY, null) }
export function saveOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
  window.dispatchEvent(new Event('iri-orders'))
}
export function pushOrder(order) {
  const cur = loadOrders() || seedOrders()
  saveOrders([order, ...cur])
}
export function makeCode() { return 'IC-' + String(Math.floor(1000 + Math.random() * 9000)) }

const NAMES = ['Valentina', 'Camila', 'Mateo', 'Sofía', 'Diego', 'Lucía', 'Andrés', 'Isabella', 'Joaquín', 'Mariana', 'Sebastián', 'Daniela']
const NOTES = ['Es para un cumple 🎂', '', 'Porfa con cinta rosada', '', 'Llamar al llegar', '', 'Sin nueces si se puede']
const pick = (a) => a[Math.floor(Math.random() * a.length)]

export function randomOrder(status = 'new', minsAgo = 0) {
  const size = Math.random() > 0.6 ? 12 : 6
  const ids = Object.keys(flavourById)
  const items = Array.from({ length: size }, () => pick(ids))
  const extras = Math.random() > 0.7 ? { [pick(EXTRAS).id]: 1 } : {}
  const delivery = Math.random() > 0.5
  const extrasTotal = Object.entries(extras).reduce((s, [id, q]) => s + extraById[id].price * q, 0)
  return {
    code: makeCode(), name: pick(NAMES), contact: '@' + pick(NAMES).toLowerCase() + '_scz',
    size, items, extras, mode: delivery ? 'delivery' : 'pickup', address: delivery ? 'Equipetrol, Santa Cruz' : '',
    day: 'Hoy', window: pick(['10:00 – 12:00', '12:00 – 14:00', '14:00 – 16:00', '16:00 – 18:00']),
    note: pick(NOTES), total: boxPrice(size, items) + extrasTotal, status, createdAt: Date.now() - minsAgo * 60000, demo: true,
  }
}
export function seedOrders() {
  const o = [randomOrder('new', 4), randomOrder('new', 11), randomOrder('baking', 26), randomOrder('baking', 38), randomOrder('ready', 55), randomOrder('done', 90)]
  saveOrders(o)
  return o
}
