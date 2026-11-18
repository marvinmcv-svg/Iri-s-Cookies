# IriCookies — tienda online

Sitio de pedidos para **IriCookies** (Santa Cruz, Bolivia · [@iri_cookies](https://www.instagram.com/iri_cookies/)).

- **Arma tu caja** (6 u 12) con los sabores del menú, extras (Cookie Pie, Bake your own, Fit).
- **Checkout en 3 pasos**: pickup/delivery, día y horario, datos → abre WhatsApp con el pedido listo.
- **Kitchen board** en `/kitchen`: tablero Nuevos → Horneando → Listos, lista de horneado.
  Hoy guarda los pedidos en el navegador (localStorage, sincroniza entre pestañas); para compartirlo
  entre dispositivos hay que conectar una base de datos (ver `src/store.jsx`).

Precios y sabores en `src/data.js`. Fotos de producto en `public/img`.

```bash
npm install
npm run dev     # desarrollo
npm run build   # build de producción (dist/)
```

Desplegado en Vercel (Vite, output `dist`).
