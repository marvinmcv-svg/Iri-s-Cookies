import { test, expect } from '@playwright/test'
import { visit, scrollThrough, brokenImages } from './helpers'

test.describe('Storefront', () => {
  test('loads cleanly: no JS errors, no broken images, no horizontal scroll', async ({ page }) => {
    const failed = []
    page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('/api/')) failed.push(r.status() + ' ' + r.url()) })
    const errors = await visit(page)
    await scrollThrough(page)

    const broken = await brokenImages(page)
    expect(broken, 'broken images').toEqual([])
    expect(failed, 'failed requests').toEqual([])
    expect(errors, 'console / page errors').toEqual([])

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow, 'page is wider than the viewport').toBeLessThanOrEqual(0)
  })

  test('all main sections render', async ({ page }) => {
    await visit(page)
    for (const id of ['#top', '#shop', '#como', '#sabores', '#build', '#mas', '#eventos', '#pedir']) {
      await expect(page.locator(id), id).toBeAttached()
    }
    await expect(page.locator('footer.foot')).toBeAttached()
  })
})

test.describe('Extras: original product photos', () => {
  test('Cookie Pie shows the tin photo and Bake your own shows the bag photo', async ({ page }) => {
    await visit(page)
    const pie = page.locator('.b-cookie-pie .bento-img img')
    const bake = page.locator('.b-bake-your-own .bento-img img')
    await pie.scrollIntoViewIfNeeded()
    await expect(pie).toHaveAttribute('src', '/img/pie-lid.webp')
    await expect(pie).toHaveAttribute('alt', "Cookie Pie S'mores & Nutella")
    await bake.scrollIntoViewIfNeeded()
    await expect(bake).toHaveAttribute('src', '/img/bake-bag.webp')
    for (const img of [pie, bake]) {
      await expect.poll(() => img.evaluate((i) => i.complete && i.naturalWidth > 0)).toBe(true)
      const box = await img.boundingBox()
      expect(box.width).toBeGreaterThan(80)
      expect(box.height).toBeGreaterThan(80)
    }
  })

  test('adding extras updates the bag and opens checkout', async ({ page }) => {
    await visit(page)
    const card = page.locator('.b-cookie-pie')
    await card.scrollIntoViewIfNeeded()
    await card.getByRole('button', { name: 'Agregar +' }).click()
    await expect(card.locator('.stepper span')).toHaveText('1')
    await card.getByRole('button', { name: 'Agregar', exact: true }).click()
    await expect(card.locator('.stepper span')).toHaveText('2')
    await expect(page.locator('.nav-bag-count')).toHaveText('2')
    await page.locator('.nav-bag').click()
    await expect(page.getByRole('dialog', { name: /cómo lo quieres/i })).toBeVisible()
  })
})

test.describe('Ordering flow', () => {
  test('build a box of 6 and send it to the kitchen via WhatsApp', async ({ page, context }) => {
    await visit(page)
    await page.locator('#build').scrollIntoViewIfNeeded()
    await page.locator('.build-panel .pill-pink').scrollIntoViewIfNeeded()
    await expect(page.locator('.build-panel .pill-pink')).toBeDisabled()
    const add = page.locator('.fcard-foot button[aria-label="Agregar Nutella"]')
    await add.click()
    const plus = page.locator('.fcard-foot button[aria-label="Agregar Chocolate Chip"]')
    for (let i = 0; i < 5; i++) await plus.click()
    await expect(page.locator('.nav-bag-count')).toHaveText('6')

    await page.locator('.build-panel .pill-pink').click()
    const dlg = page.locator('.co')
    await expect(dlg).toBeVisible()
    await dlg.getByRole('button', { name: /delivery/i }).click()
    await dlg.getByRole('button', { name: 'Continuar a tus datos' }).click()
    await dlg.getByRole('button', { name: 'Revisar pedido' }).click()
    await expect(dlg.locator('.co-err')).toContainText('dirección')
    await dlg.getByPlaceholder('Tu nombre').fill('Test Playwright')
    await dlg.getByPlaceholder('+591 7xx xxxxx').fill('+591 70000000')
    await dlg.getByPlaceholder('Barrio, calle, referencia').fill('Equipetrol, calle 1')
    await dlg.getByRole('button', { name: 'Revisar pedido' }).click()
    await expect(dlg.locator('.co-total b')).toHaveText('92 Bs') // 87 + 5 premium

    // Block the real WhatsApp navigation, but capture it.
    await context.route('https://wa.me/**', (r) => r.fulfill({ status: 200, body: 'wa' }))
    await context.route('https://api.whatsapp.com/**', (r) => r.fulfill({ status: 200, body: 'wa' }))
    const popup = context.waitForEvent('page')
    await dlg.getByRole('button', { name: 'Enviar a la cocina' }).click()
    const wa = await popup
    const url = decodeURIComponent(wa.url())
    expect(url).toContain('wa.me/59169078820')
    expect(url).toContain('Caja de 6')
    expect(url).toContain('Nutella')
    expect(url).toContain('Equipetrol, calle 1')
    await expect(dlg.locator('.co-done')).toBeVisible()
  })
})
