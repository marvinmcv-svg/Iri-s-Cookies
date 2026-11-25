import { test, expect } from '@playwright/test'
import { visit, fillBox } from './helpers'

// Regressions found in the design review.
test.describe('Review fixes', () => {
  test('every flavour’s “Agregar” button is readable (dark flavours too)', async ({ page }) => {
    await visit(page)
    const n = 9
    for (let i = 0; i < n; i++) {
      await page.evaluate(([i, n]) => {
        const el = document.getElementById('sabores')
        window.scrollTo(0, el.offsetTop + (el.offsetHeight - innerHeight) * ((i + 0.5) / n))
      }, [i, n])
      await page.waitForTimeout(900) // colour transition + swap
      const btn = page.locator('.flav-info .pill-ink')
      await expect(btn).toBeVisible()
      const c = await btn.evaluate((b) => { const s = getComputedStyle(b); return [s.color, s.backgroundColor] })
      expect(c[0], `flavour ${i + 1}: text colour equals button colour`).not.toBe(c[1])
      await expect(btn).toContainText(/Agregar|llena/)
    }
  })

  test('the flavour counter does not sit on top of the cookie (phones)', async ({ page }) => {
    test.skip(page.viewportSize().width > 900, 'desktop keeps the counter in its own column')
    await visit(page)
    await page.locator('#sabores').scrollIntoViewIfNeeded()
    await page.evaluate(() => window.scrollBy(0, innerHeight))
    await page.waitForTimeout(800)
    const [a, b] = [await page.locator('.flav-count').boundingBox(), await page.locator('.flav-cookie-inner img').first().boundingBox()]
    const overlap = !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y)
    expect(overlap).toBe(false)
  })

  test('FAQ: one answer open at a time', async ({ page }) => {
    await visit(page)
    const faq = page.locator('#faq')
    await faq.scrollIntoViewIfNeeded()
    await expect(faq.getByRole('region')).toHaveCount(1)
    await expect(faq.getByRole('region')).toContainText('87 Bs')
    await faq.getByRole('button', { name: '¿Hacen delivery?' }).click()
    await expect(faq.getByRole('button', { name: '¿Hacen delivery?' })).toHaveAttribute('aria-expanded', 'true')
    await expect(faq.getByRole('region')).toHaveCount(1)
    await expect(faq.getByRole('region')).toContainText('Santa Cruz')
  })

  test('checkout never offers a time slot that has already passed', async ({ page }) => {
    await page.clock.setFixedTime(new Date(2026, 10, 25, 17, 30)) // 17:30, after the last same-day slot
    await visit(page)
    await fillBox(page)
    await page.locator('.build-panel .pill-pink').click()
    const days = page.locator('.co-days button')
    await expect(days.first()).toContainText('Mañana')
    await expect(page.locator('.co-days button.on')).toContainText('Mañana')
    await expect(page.locator('.co-wins button')).toHaveCount(4)
  })

  test('same-day slots respect the lead time', async ({ page }) => {
    await page.clock.setFixedTime(new Date(2026, 10, 25, 11, 15)) // 11:15 → only 14:00 and 16:00 left today
    await visit(page)
    await fillBox(page)
    await page.locator('.build-panel .pill-pink').click()
    await page.locator('.co-days button', { hasText: 'Hoy' }).click()
    await expect(page.locator('.co-wins button')).toHaveText(['14:00 – 16:00', '16:00 – 18:00'])
  })

  test('returning customers do not retype their details', async ({ page, context }) => {
    await visit(page)
    await fillBox(page)
    await page.locator('.build-panel .pill-pink').click()
    const dlg = page.locator('.co')
    await dlg.getByRole('button', { name: 'Continuar a tus datos' }).click()
    await dlg.getByPlaceholder('Tu nombre').fill('Camila')
    await dlg.getByPlaceholder('+591 7xx xxxxx').fill('+591 70000000')
    await dlg.getByRole('button', { name: 'Revisar pedido' }).click()
    await context.route('https://wa.me/**', (r) => r.fulfill({ status: 200, body: 'wa' }))
    const popup = context.waitForEvent('page')
    await dlg.getByRole('button', { name: 'Enviar por WhatsApp' }).click()
    await (await popup).close()
    await dlg.getByRole('button', { name: 'Seguir viendo' }).click()

    await fillBox(page)
    await page.locator('.build-panel .pill-pink').click()
    await dlg.getByRole('button', { name: 'Continuar a tus datos' }).click()
    await expect(dlg.getByPlaceholder('Tu nombre')).toHaveValue('Camila')
    await expect(dlg.getByPlaceholder('+591 7xx xxxxx')).toHaveValue('+591 70000000')
  })

  test('the kitchen board is not linked from the shop and is not indexed', async ({ page }) => {
    await visit(page)
    await expect(page.locator('a[href="/kitchen"]')).toHaveCount(0)
    await page.goto('/kitchen')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  })
})
