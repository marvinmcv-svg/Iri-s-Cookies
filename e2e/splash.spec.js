import { test, expect } from '@playwright/test'

test.describe('Loading screen', () => {
  test('shows Iri while the shop loads, then gets out of the way', async ({ page }) => {
    await page.goto('/', { waitUntil: 'commit' })
    const splash = page.locator('#splash')
    await expect(splash).toBeVisible()
    await expect(splash).toHaveAttribute('role', 'status')
    const logo = splash.locator('img')
    await expect(logo).toHaveAttribute('src', '/img/iri-logo.webp')
    await expect.poll(() => logo.evaluate((i) => i.complete && i.naturalWidth > 0)).toBe(true)
    const b = await logo.boundingBox()
    expect(Math.abs(b.width - b.height), 'logo keeps its round shape').toBeLessThan(4)
    const vp = page.viewportSize()
    const box = await splash.boundingBox()
    expect(box.width).toBeGreaterThanOrEqual(vp.width - 1)
    expect(box.height).toBeGreaterThanOrEqual(vp.height - 1)
    await expect(splash.getByText('Horneando tus cookies')).toBeVisible()

    const t0 = Date.now()
    await expect(splash).toHaveCount(0, { timeout: 6000 })
    expect(Date.now() - t0, 'splash is short').toBeLessThan(5500)
    await page.locator('.hero-after .pill').click() // page is usable right after
    await expect(page.locator('#build')).toBeInViewport({ ratio: 0.05 })
  })
})
