import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Reveal from './Reveal'
import { BOX_SIZES, SINGLE_PRICE, PREMIUM_UPCHARGE, WINDOWS, WHATSAPP, WHATSAPP_PRETTY, LEAD_HOURS } from '../data'

// Only facts the shop has stated. Anything we don't know (exact delivery cost, allergens) goes to WhatsApp.
export const FAQS = [
  {
    q: '¿Cuánto cuestan?',
    a: `Una cookie suelta, ${SINGLE_PRICE} Bs. La caja de 6, ${BOX_SIZES[0].price} Bs y la de 12, ${BOX_SIZES[1].price} Bs. Lotus Biscoff y Nutella son premium: suman ${PREMIUM_UPCHARGE} Bs por cookie dentro de la caja.`,
  },
  {
    q: '¿Cuándo las hornean?',
    a: 'El mismo día de tu pedido. No vendemos stock de ayer: eliges el día y la franja, y las horneamos para esa entrega.',
  },
  {
    q: '¿Hacen delivery?',
    a: `Sí, dentro de Santa Cruz de la Sierra. El costo depende de tu zona y te lo confirmamos por WhatsApp. Si prefieres, el pickup es gratis.`,
  },
  {
    q: '¿Qué horarios hay?',
    a: `Entregamos y hacemos pickup en franjas de dos horas: ${WINDOWS.join(', ')}. Para el mismo día, la franja tiene que empezar en ${LEAD_HOURS} horas o más.`,
  },
  {
    q: '¿Cómo pago?',
    a: 'En la web no se cobra nada. Cuando envías tu pedido por WhatsApp te confirmamos disponibilidad y coordinamos el pago por ahí.',
  },
  {
    q: '¿Tienen opciones sin gluten, sin azúcar o para alergias?',
    a: `Tenemos cookies Fit, pero no publicamos la lista de ingredientes. Si tienes una alergia o restricción, escríbenos al ${WHATSAPP_PRETTY} antes de pedir y te decimos exactamente qué lleva cada una.`,
  },
  {
    q: '¿Puedo pedir para un evento?',
    a: 'Sí. Alquilamos el carrito de IriCookies lleno de cookies recién horneadas para cumpleaños, bodas, baby showers y empresas. Cuéntanos fecha, lugar e invitados y te cotizamos.',
  },
]

const ld = JSON.stringify({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: FAQS.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
})

export default function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <section className="faq wrap" id="faq">
      <div className="faq-head">
        <Reveal><p className="kicker">Preguntas</p></Reveal>
        <Reveal><h2 className="display">Lo que todos <span className="serif accent">preguntan.</span></h2></Reveal>
        <Reveal delay={0.1}>
          <p className="lede">¿No está tu duda? <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer">Escríbenos por WhatsApp</a> o pregúntale a Iri, abajo a la derecha.</p>
        </Reveal>
      </div>
      <div className="faq-list">
        {FAQS.map(({ q, a }, i) => {
          const on = open === i
          return (
            <div key={q} className={'faq-item' + (on ? ' on' : '')}>
              <h3>
                <button aria-expanded={on} aria-controls={'faq-' + i} id={'faq-q-' + i} onClick={() => setOpen(on ? -1 : i)}>
                  <span>{q}</span><i aria-hidden="true" />
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {on && (
                  <motion.div id={'faq-' + i} role="region" aria-labelledby={'faq-q-' + i} className="faq-a"
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}>
                    <p>{a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld }} />
    </section>
  )
}
