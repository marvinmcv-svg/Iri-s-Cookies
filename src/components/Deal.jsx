import Reveal from './Reveal'
import { WHATSAPP, WHATSAPP_PRETTY } from '../data'

export default function Deal() {
  return (
    <section className="deal wrap">
      <Reveal className="deal-card">
        <img src="/img/smores.webp" alt="Cookie S'mores de IriCookies" className="deal-img" loading="lazy" />
        <div className="deal-left">
          <p className="kicker">El deal de siempre</p>
          <h2 className="display">6 por 87 Bs,<br /><span className="serif accent-soft">todos los días.</span></h2>
        </div>
        <dl className="deal-list">
          <div><dt>Pickup o delivery</dt><dd>En Santa Cruz. El delivery se cotiza según tu zona.</dd></div>
          <div><dt>Premium +5 Bs</dt><dd>Biscoff y Nutella suman 5 Bs por cookie en tu caja.</dd></div>
          <div><dt>¿Prefieres WhatsApp?</dt><dd><a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer">Escríbenos al {WHATSAPP_PRETTY}</a></dd></div>
        </dl>
      </Reveal>
    </section>
  )
}
