import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useBag } from '../store'
import { Wordmark, WaIcon } from './Brand'
import { WHATSAPP } from '../data'

const LINKS = [['Shop', '#shop'], ['Sabores', '#sabores'], ['Cómo funciona', '#como'], ['Eventos', '#eventos'], ['Pedir', '#pedir']]

export default function Nav() {
  const { count, pulse, canCheckout, setCheckoutOpen } = useBag()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40)
    on(); window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  const bagClick = (e) => {
    if (canCheckout) { e.preventDefault(); setCheckoutOpen(true) }
  }
  return (
    <header className={'nav' + (scrolled ? ' is-scrolled' : '')}>
      <div className="nav-inner">
        <nav className="nav-links" aria-label="Principal">
          {LINKS.map(([l, h]) => <a key={h} href={h}>{l}</a>)}
        </nav>
        <a href="#top" className="nav-logo" aria-label="IriCookies inicio"><Wordmark /></a>
        <div className="nav-right">
          <a className="nav-wa" href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"><WaIcon /> <span>WhatsApp</span></a>
          <a href="#build" onClick={bagClick} className="nav-bag">
            Tu caja
            <motion.span key={pulse} className="nav-bag-count" initial={{ scale: 1.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }}>{count}</motion.span>
          </a>
          <button className={'nav-burger' + (open ? ' is-open' : '')} onClick={() => setOpen(!open)} aria-label="Menú" aria-expanded={open}><i /><i /></button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div className="nav-sheet" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            {LINKS.map(([l, h], i) => (
              <motion.a key={h} href={h} onClick={() => setOpen(false)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }}>{l}</motion.a>
            ))}
            <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" className="nav-sheet-wa"><WaIcon /> Pedir por WhatsApp</a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
