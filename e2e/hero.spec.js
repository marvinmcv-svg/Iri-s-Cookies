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
    // headline is fully on screen and not cut by the footer row
    const t = await page.locator('.hero-title').boundingBox()
    const foot = await page.locator('.hero-foot').boundingBox()
    expect(t.x).toBeGreaterThanOrEqual(0)
    expect(t.x + t.width).toBeLessThanOrEqual(vp.width)
    expect(t.y + t.height).toBeLessThan(foot.y)
    await expect(page.locator('.hero-foot .pill')).toBeInViewport()
  })

  test('it spins on its own, and a tapped cookie comes to the front', async ({ page }) => {
    await visit(page)
    await page.waitForTimeout(1800)
    const first = await page.locator('.hero-cookie').first().boundingBox()
    await page.waitForTimeout(700)
    const later = await page.locator('.hero-cookie').first().boundingBox()
    expect(Math.abs(first.x - later.x) + Math.abs(first.y - later.y), 'orbit is moving').toBeGreaterThan(2)

    await page.locator('.hero-cookie[aria-label="Ver Red Velvet"]').click({ force: true })
    await expect(page.locator('.hero-now-name')).toHaveText('Red Velvet', { timeout: 5000 })
    await expect(page.locator('.hero-cookie[aria-label="Ver Red Velvet"]')).toHaveAttribute('aria-pressed', 'true')
  })

  test('“+ A mi caja” adds the front flavour to the box', async ({ page }) => {
    await visit(page)
    await page.locator('.hero-cookie[aria-label="Ver Nutella"]').click({ force: true })
    await expect(page.locator('.hero-now-name')).toContainText('Nutella', { timeout: 5000 })
    await page.locator('.hero-now-add').click()
    await expect(page.locator('.nav-bag-count')).toHaveText('1')
    await page.locator('#build').scrollIntoViewIfNeeded()
    await expect(page.locator('.fcard-foot', { has: page.locator('[aria-label="Agregar Nutella"]') }).locator('.stepper span')).toHaveText('1')
  })

  test('CTAs go to the builder and to WhatsApp booking', async ({ page }) => {
    await visit(page)
    await page.locator('.hero-foot').getByRole('link', { name: 'Arma tu caja' }).click()
    await expect(page.locator('#build')).toBeInViewport({ ratio: 0.05 })
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.locator('.hero-wa').click()
    await expect(page.locator('#pedir')).toBeInViewport({ ratio: 0.05 })
  })
})
