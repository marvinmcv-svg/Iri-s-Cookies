import { motion, AnimatePresence } from 'motion/react'
import { useBag } from '../store'
import { Arrow } from './Brand'
import { flavourById } from '../data'

export default function MobileBar() {
  const b = useBag()
  const show = b.count > 0 && !b.checkoutOpen
  const total = (b.bag.items.length ? b.boxTotal : 0) + b.extrasTotal
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="mbar" initial={{ y: 120 }} animate={{ y: 0 }} exit={{ y: 120 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
          <a href="#build" className="mbar-left">
            <span className="mbar-dots">{b.bag.items.slice(-4).map((id, i) => <img key={i} src={flavourById[id].img} alt="" />)}</span>
            <span><b>{b.bag.items.length}/{b.bag.size}</b> · {total} Bs</span>
          </a>
          <button className="pill pill-pink sm" disabled={!b.canCheckout} onClick={() => b.setCheckoutOpen(true)}>
            <span>{b.canCheckout ? 'Pedir' : `Faltan ${b.bag.size - b.bag.items.length}`}</span><i className="pill-dot"><Arrow /></i>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
