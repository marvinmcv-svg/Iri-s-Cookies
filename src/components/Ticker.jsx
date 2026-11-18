const ITEMS = ['1 cookie · 15 Bs', 'Caja de 6 · 87 Bs', 'Caja de 12 · 168 Bs', 'Delivery o pickup', 'Biscoff & Nutella · premium', 'Horneadas el día que eliges', 'Santa Cruz, Bolivia']
export default function Ticker({ variant = 'dark' }) {
  const row = [...ITEMS, ...ITEMS]
  return (
    <div className={'ticker ticker-' + variant} aria-label={ITEMS.join(', ')}>
      <div className="ticker-track" aria-hidden="true">
        {row.map((t, i) => <span key={i}>{t}<i className="mask mark" /></span>)}
      </div>
    </div>
  )
}
