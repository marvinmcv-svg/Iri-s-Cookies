# IriCookies — tienda online

Sitio de pedidos para **IriCookies** (Santa Cruz, Bolivia · [@iri_cookies](https://www.instagram.com/iri_cookies/)).

- **Arma tu caja** (6 u 12) con los sabores del menú, extras (Cookie Pie, Bake your own, Fit).
- **Checkout en 3 pasos**: pickup/delivery, día y horario, datos → abre WhatsApp con el pedido listo.
- **Kitchen board** en `/kitchen`: tablero Nuevos → Horneando → Listos, lista de horneado.
  Hoy guarda los pedidos en el navegador (localStorage, sincroniza entre pestañas); para compartirlo
  entre dispositivos hay que conectar una base de datos (ver `src/store.jsx`).

- **Iri, recepcionista con IA** (botón con la chef, abajo a la derecha): responde sobre precios, sabores, delivery,
  pedidos y eventos. Su conocimiento sale de `src/data.js` + `src/iri/knowledge.js`; el endpoint es `api/chat.js`
  (función de Vercel, modelo NVIDIA Nemotron). Necesita la variable de entorno **`NVIDIA_API_KEY`**
  (en Vercel: Settings → Environment Variables; en local: `.env.local`, ver `.env.example`).
- **Botón flotante de WhatsApp** junto a Iri.

Precios y sabores en `src/data.js`. Fotos de producto en `public/img`.

```bash
npm install
npm run dev     # desarrollo
npm run build   # build de producción (dist/)
npm run test:e2e          # Playwright: escritorio, iPad y teléfonos (7 dispositivos)
npm run test:e2e:live     # pregunta reales a Iri (requiere NVIDIA_API_KEY)
```

Desplegado en Vercel (Vite, output `dist`).
