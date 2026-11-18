import { expect } from '@playwright/test'

export const WA = 'https://wa.me/59169078820'

/** Fresh visit: clean storage, skip Iri's nudge bubble, collect console errors. */
export async function visit(page, { hint = false } = {}) {
  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })
  await page.addInitScript((hint) => {
    if (!sessionStorage.getItem('__pw')) { localStorage.clear(); sessionStorage.clear(); sessionStorage.setItem('__pw', '1') }
    if (!hint) sessionStorage.setItem('iri.hint', '1')
  }, hint)
  await page.goto('/')
  await ready(page)
  return errors
}

/** Page is hydrated; smooth scrolling off so Playwright's auto-scroll is deterministic. */
export async function ready(page) {
  await expect(page.locator('#splash')).toHaveCount(0, { timeout: 8000 }) // loading screen finished
  await expect(page.locator('.hero-title')).toBeVisible()
  await expect(page.locator('.hero-cookie')).toHaveCount(9)
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
}

/** Force every image to load and return the ones that fail. */
export async function brokenImages(page) {
  return page.evaluate(async () => {
    const imgs = [...document.images]
    imgs.forEach((i) => { i.loading = 'eager' })
    await Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 15000) }))))
    return imgs.filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.currentSrc || i.src)
  })
}

/** Scroll the whole page in steps so lazy images and reveal animations fire. */
export async function scrollThrough(page) {
  await page.evaluate(async () => {
    const step = Math.round(innerHeight * 0.8)
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60))
    }
    window.scrollTo(0, document.documentElement.scrollHeight)
    await new Promise((r) => setTimeout(r, 400))
  })
}

export const isMobile = (page) => page.viewportSize().width <= 640
export const hasMobileBar = (page) => page.viewportSize().width <= 900

/** Fill the 6-box via the builder's "+" buttons. */
export async function fillBox(page, n = 6) {
  await page.locator('#build').scrollIntoViewIfNeeded()
  const add = page.locator('.fcard-foot button[aria-label="Agregar Chocolate Chip"]')
  for (let i = 0; i < n; i++) await add.click()
}

/** Mock the /api/chat stream so UI tests are deterministic. */
export async function mockIri(page, reply = 'La **caja de 6** cuesta 87 Bs 🍪\n- Arma tu caja aquí: [Arma tu caja](#build)\n- O escribe a https://wa.me/59169078820', status = 200) {
  const calls = []
  await page.route('**/api/chat', async (route) => {
    calls.push(JSON.parse(route.request().postData() || '{}'))
    await route.fulfill({ status, contentType: 'text/plain; charset=utf-8', body: status === 200 ? reply : 'error' })
  })
  return calls
}

/** True if the two elements' boxes overlap. */
export async function overlaps(a, b) {
  const [ra, rb] = [await a.boundingBox(), await b.boundingBox()]
  if (!ra || !rb) return false
  return !(ra.x + ra.width <= rb.x || rb.x + rb.width <= ra.x || ra.y + ra.height <= rb.y || rb.y + rb.height <= ra.y)
}

/** The floating WhatsApp/Iri dock appears once the hero is scrolled past. */
export async function showDock(page) {
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.2))
  await expect(page.locator('.iri-fab')).toBeVisible()
  await page.waitForTimeout(600) // dock fade-in
}
