import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useBag } from '../store'
import { WaIcon } from './Brand'
import { WHATSAPP } from '../data'
import { GREETING, QUICK_REPLIES, FALLBACK } from '../iri/knowledge'

const STORE_KEY = 'iri.chat.v1'
const AVATAR = '/img/iri-chef.svg'
const WA_TEXT = encodeURIComponent('¡Hola IriCookies! 🍪 Tengo una consulta.')

/* ---------- tiny, safe markdown: **bold**, [link](url), "- " lists ---------- */
function inline(text, onLink, keyBase) {
  const out = []
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|(https:\/\/[^\s)*<>]+[^\s)*<>.,;:!?])/g
  let last = 0, m, k = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    if (m[1]) out.push(<strong key={keyBase + '-' + k++}>{inline(m[1], onLink, keyBase + 'b' + k)}</strong>)
    else if (m[4]) out.push(<a key={keyBase + '-' + k++} href={m[4]} target="_blank" rel="noreferrer">{m[4].includes('wa.me') ? 'WhatsApp' : m[4].replace('https://', '')}</a>)
    else {
      const href = m[3]
      const safe = /^(https:\/\/|#|\/)/.test(href)
      if (!safe) out.push(m[2])
      else if (href.startsWith('#') || href.startsWith('/')) out.push(<a key={keyBase + '-' + k++} href={href} onClick={onLink}>{m[2]}</a>)
      else out.push(<a key={keyBase + '-' + k++} href={href} target="_blank" rel="noreferrer">{m[2]}</a>)
    }
    last = re.lastIndex
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}
function Rich({ text, onLink }) {
  const blocks = []
  let list = null
  text.split('\n').forEach((raw, i) => {
    const line = raw.trimEnd()
    const li = line.match(/^\s*(?:[-*•]|\d+\.)\s+(.*)$/)
    if (li) { (list ||= []).push(<li key={i}>{inline(li[1], onLink, 'l' + i)}</li>); return }
    if (list) { blocks.push(<ul key={'u' + i}>{list}</ul>); list = null }
    if (line.trim()) blocks.push(<p key={i}>{inline(line, onLink, 'p' + i)}</p>)
  })
  if (list) blocks.push(<ul key="u-end">{list}</ul>)
  return <>{blocks}</>
}

const loadChat = () => {
  try { const v = JSON.parse(sessionStorage.getItem(STORE_KEY)); if (Array.isArray(v)) return v } catch { /* empty */ }
  return []
}

export default function Concierge() {
  const b = useBag()
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState(loadChat)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState(false)
  const listRef = useRef(null)
  const inputRef = useRef(null)
  const launcherRef = useRef(null)
  const abortRef = useRef(null)

  const lifted = b.count > 0 // mobile order bar is visible
  const [past, setPast] = useState(false) // dock appears once the hero is scrolled past
  useEffect(() => {
    const on = () => setPast(window.scrollY > window.innerHeight * 0.55)
    on(); window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  const hidden = b.checkoutOpen

  useEffect(() => { sessionStorage.setItem(STORE_KEY, JSON.stringify(msgs.slice(-30))) }, [msgs])

  // Friendly nudge once per session.
  useEffect(() => {
    if (sessionStorage.getItem('iri.hint')) return
    if (!past) return
    const t = setTimeout(() => { setHint(true); sessionStorage.setItem('iri.hint', '1') }, 4000)
    const t2 = setTimeout(() => setHint(false), 16000)
    return () => { clearTimeout(t); clearTimeout(t2) }
  }, [past])

  useEffect(() => {
    if (!open) return
    setHint(false)
    const mobile = window.matchMedia('(max-width: 640px)').matches
    const prev = document.body.style.overflow
    if (mobile) document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    const t = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 120)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); clearTimeout(t) }
  }, [open])

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgs, busy, open])

  const close = useCallback(() => { setOpen(false); setTimeout(() => launcherRef.current?.focus({ preventScroll: true }), 50) }, [])

  const onLink = (e) => {
    const href = e.currentTarget.getAttribute('href')
    if (href?.startsWith('#')) {
      e.preventDefault()
      setOpen(false)
      setTimeout(() => document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' }), 80)
    }
  }

  const send = async (text) => {
    const q = (text ?? input).trim().slice(0, 800)
    if (!q || busy) return
    setInput('')
    const history = [...msgs, { role: 'user', content: q }]
    setMsgs([...history, { role: 'assistant', content: '', pending: true }])
    setBusy(true)
    const ctrl = new AbortController(); abortRef.current = ctrl
    let acc = ''
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', signal: ctrl.signal, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.filter((m) => m.content).map(({ role, content }) => ({ role, content })) }),
      })
      if (!res.ok || !res.body) throw new Error('bad status ' + res.status)
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        acc += dec.decode(value, { stream: true })
        const now = acc
        setMsgs((m) => { const c = m.slice(); c[c.length - 1] = { role: 'assistant', content: now, pending: true }; return c })
      }
      if (!acc.trim()) throw new Error('empty')
      setMsgs((m) => { const c = m.slice(); c[c.length - 1] = { role: 'assistant', content: acc.trim() }; return c })
    } catch (e) {
      if (e.name === 'AbortError') return
      setMsgs((m) => { const c = m.slice(); c[c.length - 1] = { role: 'assistant', content: acc.trim() || FALLBACK, error: !acc.trim() }; return c })
    } finally {
      setBusy(false); abortRef.current = null
    }
  }

  const reset = () => { abortRef.current?.abort(); setBusy(false); setMsgs([]) }

  return (
    <div className={'iri' + (lifted ? ' is-lifted' : '') + (hidden ? ' is-hidden' : '') + (open ? ' is-open' : '') + (past || open ? '' : ' is-docked')}>
      <AnimatePresence>
        {open && (
          <motion.section
            key="panel" className="iri-panel" role="dialog" aria-modal="false" aria-labelledby="iri-title"
            initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            <header className="iri-head">
              <span className="iri-ava"><img src={AVATAR} alt="" width="44" height="44" /><i className="iri-online" /></span>
              <div className="iri-who">
                <strong id="iri-title">Iri</strong>
                <small>Recepcionista de IriCookies · en línea</small>
              </div>
              {msgs.length > 0 && <button className="iri-ghost" onClick={reset} aria-label="Nueva conversación" title="Nueva conversación">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
              </button>}
              <button className="iri-ghost" onClick={close} aria-label="Cerrar chat">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </header>

            <div className="iri-log" ref={listRef} aria-live="polite" aria-busy={busy}>
              <div className="iri-msg bot"><Rich text={GREETING} onLink={onLink} /></div>
              {msgs.map((m, i) => (
                <div key={i} className={'iri-msg ' + (m.role === 'user' ? 'me' : 'bot') + (m.error ? ' err' : '')} data-testid={m.role === 'user' ? 'iri-user-msg' : 'iri-bot-msg'}>
                  {m.pending && !m.content ? <span className="iri-typing" aria-label="Iri está escribiendo"><i /><i /><i /></span> : <Rich text={m.content} onLink={onLink} />}
                </div>
              ))}
              {msgs.length === 0 && (
                <div className="iri-quick" role="group" aria-label="Preguntas frecuentes">
                  {QUICK_REPLIES.map((q) => <button key={q} onClick={() => send(q)}>{q}</button>)}
                </div>
              )}
            </div>

            <form className="iri-form" onSubmit={(e) => { e.preventDefault(); send() }}>
              <label htmlFor="iri-input" className="sr-only">Escribe tu pregunta para Iri</label>
              <textarea
                id="iri-input" ref={inputRef} rows={1} value={input} maxLength={800} placeholder="Pregúntale a Iri…"
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() } }}
              />
              <button type="submit" className="iri-send" disabled={busy || !input.trim()} aria-label="Enviar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
            </form>
            <p className="iri-foot">Iri es una IA y puede equivocarse. Confirma tu pedido por <a href={`https://wa.me/${WHATSAPP}?text=${WA_TEXT}`} target="_blank" rel="noreferrer">WhatsApp</a>.</p>
          </motion.section>
        )}
      </AnimatePresence>

      <div className="iri-dock">
        <AnimatePresence>
          {hint && !open && (
            <motion.button key="hint" className="iri-hint" onClick={() => setOpen(true)}
              initial={{ opacity: 0, x: 12, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 12, scale: 0.9 }}>
              ¡Hola! Soy Iri 👩‍🍳 ¿Te ayudo con tu pedido?
            </motion.button>
          )}
        </AnimatePresence>
        <a className="wa-fab" href={`https://wa.me/${WHATSAPP}?text=${WA_TEXT}`} target="_blank" rel="noreferrer" aria-label="Escríbenos por WhatsApp" title="WhatsApp">
          <WaIcon size={24} />
        </a>
        <button ref={launcherRef} className="iri-fab" onClick={() => (open ? close() : setOpen(true))} aria-label={open ? 'Cerrar chat con Iri' : 'Chatea con Iri, nuestra recepcionista'} aria-expanded={open}>
          <img src={AVATAR} alt="" width="60" height="60" />
          <i className="iri-online" />
        </button>
      </div>
    </div>
  )
}
