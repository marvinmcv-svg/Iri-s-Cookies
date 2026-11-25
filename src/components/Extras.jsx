import Reveal from './Reveal'
import { EXTRAS } from '../data'
import { useBag } from '../store'

export default function Extras() {
  const { bag, setExtra } = useBag()
  return (
    <section className="extras wrap" id="mas">
      <Reveal><p className="kicker center">Además</p></Reveal>
      <Reveal><h2 className="display center">Para compartir <span className="serif accent">(o no).</span></h2></Reveal>
      <div className="bento">
        {EXTRAS.map((e, i) => {
          const q = bag.extras[e.id] || 0
          return (
            <Reveal key={e.id} delay={i * 0.08} className={'bento-item b-' + e.id}>
              <div className="bento-img"><img src={e.img} alt={e.name} loading="lazy" /></div>
              <div className="bento-body">
                <span className="chip">{e.tag}</span>
                <h3>{e.name}</h3>
                <p>{e.desc}</p>
                <div className="bento-foot">
                  <b>{e.price} Bs</b>
                  {q === 0 ? (
                    <button className="add-btn" onClick={() => setExtra(e.id, 1)}>Agregar +</button>
                  ) : (
                    <div className="stepper">
                      <button onClick={() => setExtra(e.id, q - 1)} aria-label="Quitar">−</button><span>{q}</span>
                      <button onClick={() => setExtra(e.id, q + 1)} aria-label="Agregar">+</button>
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
