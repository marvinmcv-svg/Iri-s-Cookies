import { test, expect } from '@playwright/test'
import { visit } from './helpers'

test.describe('Hero: flavour orbit', () => {
  test('all 9 flavours orbit the headline and stay inside the hero', async ({ page }) => {
    await visit(page)
    await expect(page.locator('.hero-title')).toContainText('Cookies with')
    await expect(page.locator('.hero-title')).toContainText('good fillings.')
    await page.waitForTimeout(1800) // intro fly-in
    const cookies = page.locator('.hero-cookie')
    await expect(cookies).toHaveCount(9)
    const hero = await page.locator('.hero').boundingBox()
    const vp = page.viewportSize()
    for (let i = 0; i < 9; i++) {
      const b = await cookies.nth(i).boundingBox()
      expect(b.width, 'cookie rendered').toBeGreaterThan(20)
      expect(b.y).toBeGreaterThanOrEqual(hero.y - 4)
      expect(b.x + b.width / 2, 'cookie centre on screen').toBeLessThanOrEqual(vp.width)
      expect(b.x + b.width / 2).toBeGreaterThanOrEqual(0)
    }
    // headline and main button are on the first screen
    const t = await page.locator('.hero-title').boundingBox()
    expect(t.x).toBeGreaterThanOrEqual(0)
    expect(t.x + t.width).toBeLessThanOrEqual(vp.width)
    await expect(page.locator('.hero-title')).toBeInViewport({ ratio: 0.9 })
    await expect(page.locator('.hero-after .pill')).toBeInViewport()
    // Iri's photo is loaded and the orbit is centred on it
    const arch = page.locator('.hero-arch > img')
    await expect.poll(() => arch.evaluate((i) => i.complete && i.naturalWidth > 0)).toBe(true)
    const ab = await page.locator('.hero-arch').boundingBox()
    const ring = await page.locator('.hero-ring').boundingBox()
    expect(Math.abs((ring.x + ring.width / 2) - (ab.x + ab.width / 2)), 'orbit centred on Iri').toBeLessThan(3)
  })

  test('it spins on its own, and a tapped cookie comes to the front', async ({ page }) => {
    await visit(page)
    await page.waitForTimeout(1800)
    const first = await page.locator('.hero-cookie').first().boundingBox()
    await page.waitForTimeout(700)
    const later = await page.locator('.hero-cookie').first().boundingBox()
    expect(Math.abs(first.x - later.x) + Math.abs(first.y - later.y), 'orbit is moving').toBeGreaterThan(2)

    // pointing at the orbit pauses it, so a cookie can be tapped
    await page.locator('.hero-stage').hover({ position: { x: 4, y: 4 } })
    await page.waitForTimeout(700)
    const p1 = await page.locator('.hero-cookie').first().boundingBox()
    await page.waitForTimeout(300)
    const p2 = await page.locator('.hero-cookie').first().boundingBox()
    expect(Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y), 'paused while pointing').toBeLessThan(2)
    // tap a cookie that's on the visible (front) half of the orbit but not already in front
    const label = await page.locator('.hero-cookie').evaluateAll((els) => {
      const vis = els.filter((e) => e.style.zIndex === '4' && e.getAttribute('aria-pressed') !== 'true')
      vis.sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)
      return vis[0].getAttribute('aria-label')
    })
    const name = label.replace('Ver ', '')
    await page.locator(`.hero-cookie[aria-label="${label}"]`).click()
    await expect(page.locator('.hero-now-name')).toHaveText(name, { timeout: 5000 })
    await expect(page.locator(`.hero-cookie[aria-label="${label}"]`)).toHaveAttribute('aria-pressed', 'true')
    // and it stays in front long enough to add it
    await page.mouse.move(0, 0)
    await page.waitForTimeout(2000)
    await expect(page.locator('.hero-now-name')).toHaveText(name)
  })

  test('“+ A mi caja” adds the front flavour to the box', async ({ page }) => {
    await visit(page)
    await page.locator('.hero-stage').hover({ position: { x: 4, y: 4 } }) // pause the orbit
    await page.waitForTimeout(800)
    const name = (await page.locator('.hero-now-name').evaluate((e) => e.firstChild.textContent)).trim()
    await page.locator('.hero-now-add').click()
    await expect(page.locator('.nav-bag-count')).toHaveText('1')
    await page.locator('#build').scrollIntoViewIfNeeded()
    await expect(page.locator('.fcard-foot', { has: page.locator(`[aria-label="Agregar ${name}"]`) }).locator('.stepper span')).toHaveText('1')
  })

  test('CTAs go to the builder and to WhatsApp booking', async ({ page }) => {
    await visit(page)
    await page.locator('.hero-after').getByRole('link', { name: 'Arma tu caja' }).click()
    await expect(page.locator('#build')).toBeInViewport({ ratio: 0.05 })
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.locator('.hero-wa').click()
    await expect(page.locator('#pedir')).toBeInViewport({ ratio: 0.05 })
  })
})
