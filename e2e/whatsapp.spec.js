import { test, expect } from '@playwright/test'
import { visit, fillBox, hasMobileBar, overlaps, WA } from './helpers'

test.describe('WhatsApp widget', () => {
  test('floating button is visible, on-brand and links to the shop', async ({ page }) => {
    await visit(page)
    const fab = page.locator('.wa-fab')
    await expect(fab).toBeVisible()
    await expect(fab).toHaveAttribute('href', new RegExp('^' + WA.replace(/[.]/g, '\\.') + '\\?text='))
    await expect(fab).toHaveAttribute('target', '_blank')
    await expect(fab).toHaveAccessibleName(/whatsapp/i)

    const style = await fab.evaluate((el) => { const s = getComputedStyle(el); return { bg: s.backgroundColor, radius: s.borderRadius } })
    expect(style.bg).toBe('rgb(17, 12, 14)') // brand black
    expect(style.radius).toBe('50%')

    const box = await fab.boundingBox()
    const vp = page.viewportSize()
    expect(box.width).toBeGreaterThanOrEqual(44) // touch target
    expect(box.x + box.width).toBeLessThanOrEqual(vp.width)
    expect(box.y + box.height).toBeLessThanOrEqual(vp.height)

    // stays fixed while scrolling
    await page.mouse.wheel(0, 2500)
    await page.waitForTimeout(300)
    await expect(fab).toBeInViewport()
  })

  test('does not cover the mobile order bar, and hides during checkout', async ({ page }) => {
    await visit(page)
    await fillBox(page)
    const fab = page.locator('.wa-fab'), iri = page.locator('.iri-fab')
    if (hasMobileBar(page)) {
      const bar = page.locator('.mbar')
      await expect(bar).toBeVisible()
      await page.waitForTimeout(500) // dock lift transition
      expect(await overlaps(fab, bar)).toBe(false)
      expect(await overlaps(iri, bar)).toBe(false)
    }
    await page.locator('.build-panel .pill-pink').click()
    await expect(page.locator('.co')).toBeVisible()
    await expect(fab).toBeHidden()
    await expect(iri).toBeHidden()
    await page.locator('.co-x').click()
    await expect(fab).toBeVisible()
  })
})
