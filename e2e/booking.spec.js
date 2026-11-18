import { test, expect } from '@playwright/test'
import { visit } from './helpers'

async function captureWa(context) {
  await context.route('https://wa.me/**', (r) => r.fulfill({ status: 200, body: 'wa' }))
  await context.route('https://api.whatsapp.com/**', (r) => r.fulfill({ status: 200, body: 'wa' }))
  return context.waitForEvent('page')
}

test.describe('WhatsApp booking', () => {
  test('box order: 4 steps, live phone preview, opens WhatsApp with the message', async ({ page, context }) => {
    await visit(page)
    const wb = page.locator('#pedir')
    await wb.scrollIntoViewIfNeeded()
    const preview = page.getByTestId('wb-preview')
    await expect(preview).toHaveText(/¡Hola IriCookies!/)

    // validation on step 1
    await wb.locator('.wb-send').click()
    await expect(wb.locator('.wb-err')).toContainText('Elige una opción')

    await wb.locator('.wb-kind', { hasText: 'Una caja de cookies' }).click()
    await expect(wb.locator('.wb-steps li').nth(1)).toHaveClass(/on/)
    await wb.locator('.wb-seg button', { hasText: '12' }).click()
    await wb.getByRole('button', { name: 'Continuar →' }).click()
    await expect(wb.locator('.wb-err')).toContainText('al menos un sabor')
    await wb.locator('.wb-chip', { hasText: 'Lotus Biscoff' }).click()
    await wb.locator('.wb-chip', { hasText: 'Nido' }).click()
    await expect(preview).toContainText('caja de 12')
    await expect(preview).toContainText('Lotus Biscoff, Nido')
    await expect(preview.locator('b').first()).toHaveText('caja de 12') // *bold* rendered
    await wb.getByRole('button', { name: 'Continuar →' }).click()

    await wb.getByRole('button', { name: /Delivery/ }).click()
    await wb.getByRole('button', { name: 'Revisar mensaje →' }).click()
    await expect(wb.locator('.wb-err')).toContainText('nombre y tu zona')
    await wb.getByPlaceholder('¿Cómo te llamas?').fill('Camila')
    await wb.getByPlaceholder('Ej. Equipetrol').fill('Las Palmas')
    await wb.locator('.wb-days button').nth(2).click()
    await wb.locator('.wb-chip', { hasText: '16:00 – 18:00' }).click()
    await wb.getByRole('button', { name: 'Revisar mensaje →' }).click()
    await expect(preview).toContainText('Zona: Las Palmas')
    await expect(preview).toContainText('16:00 – 18:00')
    await expect(preview).toContainText('Soy Camila')

    const popup = captureWa(context)
    await wb.locator('.wb-send-big').click()
    const url = decodeURIComponent((await popup).url())
    expect(url).toContain('wa.me/59169078820')
    for (const t of ['caja de 12', 'Lotus Biscoff, Nido', 'Delivery', 'Las Palmas', '16:00 – 18:00', 'Soy Camila']) expect(url).toContain(t)
    await expect(wb.locator('.wb-sent')).toBeVisible()
    await expect(wb.locator('.wb-msg.in').last()).toContainText('Recibido')
  })

  test('events card opens booking pre-set to the event cart', async ({ page, context }) => {
    await visit(page)
    await page.locator('#eventos').scrollIntoViewIfNeeded()
    await page.getByRole('button', { name: 'Cotizar mi evento' }).click()
    const wb = page.locator('#pedir')
    await expect(wb).toBeInViewport({ ratio: 0.05 })
    await expect(wb.locator('.wb-steps li').nth(1)).toHaveClass(/on/)
    await wb.locator('.wb-chip', { hasText: 'Boda' }).click()
    const d = new Date(Date.now() + 20 * 864e5).toISOString().slice(0, 10)
    await wb.locator('input[type="date"]').fill(d)
    await wb.getByPlaceholder('50').fill('120')
    await wb.getByPlaceholder('Ej. Urubó, salón de eventos').fill('Urubó')
    await wb.getByRole('button', { name: 'Continuar →' }).click()
    await expect(wb.getByPlaceholder('Ej. Equipetrol')).toHaveCount(0) // no delivery for events
    await wb.getByPlaceholder('¿Cómo te llamas?').fill('Sofía')
    await wb.getByRole('button', { name: 'Revisar mensaje →' }).click()
    const popup = captureWa(context)
    await wb.locator('.wb-send').click() // the phone's own send button works too
    const url = decodeURIComponent((await popup).url())
    for (const t of ['carrito para mi evento', 'Tipo: Boda', 'Invitados: ~120', 'Lugar: Urubó', 'Soy Sofía']) expect(url).toContain(t)
  })

  test('extras and questions build the right message; steps navigate back', async ({ page }) => {
    await visit(page)
    const wb = page.locator('#pedir')
    await wb.scrollIntoViewIfNeeded()
    const preview = page.getByTestId('wb-preview')
    await wb.locator('.wb-kind', { hasText: 'Cookie Pie o Bake your own' }).click()
    await wb.getByRole('button', { name: "Agregar Cookie Pie S'mores & Nutella" }).click()
    await wb.getByRole('button', { name: "Agregar Cookie Pie S'mores & Nutella" }).click()
    await wb.getByRole('button', { name: 'Agregar Bake your own' }).click()
    await expect(preview).toContainText("2× Cookie Pie S'mores & Nutella")
    await expect(preview).toContainText('Total: 225 Bs') // 2×65 + 95

    await wb.locator('.wb-steps button').first().click()
    await wb.locator('.wb-kind', { hasText: 'Tengo una consulta' }).click()
    await wb.locator('.wb-chip', { hasText: 'Pagos' }).click()
    await wb.getByPlaceholder('Escribe aquí tu consulta…').fill('¿Aceptan QR?')
    await expect(preview).toContainText('consulta sobre pagos')
    await expect(preview).toContainText('¿Aceptan QR?')
    await expect(preview).not.toContainText('Cookie Pie')
  })

  test('phone preview and steps fit the screen', async ({ page }) => {
    await visit(page)
    const vp = page.viewportSize()
    for (const sel of ['.wb-steps', '.wb-kinds', '.wb-phone']) {
      const el = page.locator(sel)
      await el.scrollIntoViewIfNeeded()
      const b = await el.boundingBox()
      expect(b.x, sel).toBeGreaterThanOrEqual(0)
      expect(b.x + b.width, sel).toBeLessThanOrEqual(vp.width + 0.5)
    }
    const overflow = await page.locator('.wb-steps button').evaluateAll((els) => els.filter((e) => e.scrollWidth > e.clientWidth + 1).length)
    expect(overflow, 'step labels overflow').toBe(0)
  })
})
