import Reveal from './Reveal'
import { Pill, Wordmark, WaIcon, IgIcon } from './Brand'
import { WHATSAPP, WHATSAPP_PRETTY, INSTAGRAM } from '../data'

export default function Footer() {
  return (
    <footer className="foot">
      <div className="foot-cta wrap">
        <Reveal><h2 className="foot-title">¿Antojo<span className="serif accent">?</span></h2></Reveal>
        <Reveal delay={0.1}><p>Seis cookies por 87 Bs. Horneadas el día que eliges.</p></Reveal>
        <Reveal delay={0.15}><Pill href="#build" variant="pink">Arma tu caja</Pill></Reveal>
      </div>
      <div className="foot-cols wrap">
        <div><h4>Pedidos</h4><a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer"><WaIcon /> {WHATSAPP_PRETTY}</a></div>
        <div><h4>Instagram</h4><a href={INSTAGRAM} target="_blank" rel="noreferrer"><IgIcon /> @iri_cookies</a></div>
        <div><h4>Dónde</h4><span>Santa Cruz de la Sierra, Bolivia<br />Delivery o pickup</span></div>
        <div><h4>Menú</h4><a href="#sabores">Sabores</a><a href="#mas">Cookie pie & Bake your own</a><a href="#eventos">Carrito para eventos</a></div>
      </div>
      <div className="foot-word"><Wordmark /></div>
      <div className="foot-base wrap">
        <span>© {new Date().getFullYear()} IriCookies · Good fillings · Hecho con amor en Santa Cruz</span>
        <a href="/kitchen">Kitchen</a>
      </div>
    </footer>
  )
}
