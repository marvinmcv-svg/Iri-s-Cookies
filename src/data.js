export const WHATSAPP = '59169078820'
export const WHATSAPP_PRETTY = '+591 690 78820'
export const INSTAGRAM = 'https://www.instagram.com/iri_cookies/'

export const BOX_SIZES = [
  { size: 6, price: 87, label: 'Caja de 6', note: 'El clásico. Para ti o para regalar.' },
  { size: 12, price: 168, label: 'Caja de 12', note: 'Más espacio para tus favoritos.' },
]
export const SINGLE_PRICE = 15
export const PREMIUM_UPCHARGE = 5

// Colours keep to the pink & black palette; each flavour gets its own stage.
export const FLAVOURS = [
  { id: 'chocolate-chip', name: 'Chocolate Chip', short: 'Choco Chip', desc: 'La clásica. Bordes dorados, centro suave y chispas de chocolate que se derriten.', img: '/img/chocolate-chip.webp', bg: '#f7d3df', ink: '#110c0e', dot: '#c9925a' },
  { id: 'cookies-cream', name: 'Cookies & Cream', short: 'C&C', desc: 'Trocitos de galleta de cacao y un corazón de crema.', img: '/img/cookies-cream.webp', bg: '#fbe7ee', ink: '#110c0e', dot: '#2a2224' },
  { id: 'red-velvet', name: 'Red Velvet', short: 'Red Velvet', desc: 'Masa roja aterciopelada con un centro suave y cremoso.', img: '/img/red-velvet.webp', bg: '#f2b6ca', ink: '#110c0e', dot: '#a3223f' },
  { id: 'smores', name: "S'mores", short: "S'mores", desc: 'Chocolate y mini marshmallows tostados. Fogata, pero en cookie.', img: '/img/smores.webp', bg: '#f7d3df', ink: '#110c0e', dot: '#f1e6d6' },
  { id: 'double-chocolate', name: 'Double Chocolate', short: 'Double Choc', desc: 'Para los que nunca tienen suficiente chocolate.', img: '/img/double-chocolate.webp', bg: '#140f11', ink: '#f7c8da', dot: '#4a2a22' },
  { id: 'salted-caramel', name: 'Salted Caramel', short: 'Salted Caramel', desc: 'Caramelo que se escapa por los bordes y un toque de sal.', img: '/img/salted-caramel.webp', bg: '#fbe7ee', ink: '#110c0e', dot: '#d08a3c' },
  { id: 'nido', name: 'Nido', short: 'Nido', desc: 'Sabor a leche Nido con su lluvia de leche en polvo.', img: '/img/nido.webp', bg: '#f2b6ca', ink: '#110c0e', dot: '#fbf4ea' },
  { id: 'biscoff', name: 'Lotus Biscoff', short: 'Biscoff', desc: 'Biscoff caramelizado, trozos de galleta y chips de chocolate blanco.', img: '/img/biscoff.webp', bg: '#140f11', ink: '#f7c8da', dot: '#b36a2c', premium: true },
  { id: 'nutella', name: 'Nutella', short: 'Nutella', desc: 'Nutella por dentro y por encima. Sin culpa, sin pausa.', img: '/img/nutella.webp', bg: '#f7d3df', ink: '#110c0e', dot: '#5a3020', premium: true },
]

export const COMING_SOON = { name: 'Cinnabon', desc: 'Nuestro nuevo sabor inspirado en la canela.' }

export const EXTRAS = [
  { id: 'cookie-pie', name: "Cookie Pie S'mores & Nutella", tag: 'Para compartir', price: 65, art: ['/img/smores.webp', '/img/nutella.webp'], desc: 'Cookie, Nutella y marshmallows tostados. Para compartir o comer a cucharadas.' },
  { id: 'bake-your-own', name: 'Bake your own', tag: 'Para hornear en casa', price: 95, art: ['/img/chocolate-chip.webp'], desc: 'Nuestra masa de choco-chip lista para tu horno. También es el regalo perfecto.' },
  { id: 'fit-chip', name: 'Chocolate Chip Fit', tag: 'Fit', price: 20, img: '/img/fit-chip.webp', desc: 'Toda la textura, versión fit. Consulta ingredientes al pedir.' },
  { id: 'fit-double', name: 'Double Chocolate Fit', tag: 'Fit', price: 22, img: '/img/fit-double.webp', desc: 'Doble chocolate, a tu manera.' },
]

export const WINDOWS = ['10:00 – 12:00', '12:00 – 14:00', '14:00 – 16:00', '16:00 – 18:00']

export const flavourById = Object.fromEntries(FLAVOURS.map((f) => [f.id, f]))
export const extraById = Object.fromEntries(EXTRAS.map((e) => [e.id, e]))

export function boxPrice(size, items) {
  const base = BOX_SIZES.find((b) => b.size === size)?.price ?? 0
  const premium = items.filter((id) => flavourById[id]?.premium).length
  return base + premium * PREMIUM_UPCHARGE
}

export function nextDays(n = 6) {
  const out = []
  const d = new Date()
  for (let i = 0; i < n; i++) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i)
    out.push({
      key: x.toISOString().slice(0, 10),
      num: String(x.getDate()).padStart(2, '0'),
      dow: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : x.toLocaleDateString('es-BO', { weekday: 'short' }).replace('.', ''),
      long: x.toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' }),
    })
  }
  return out
}
