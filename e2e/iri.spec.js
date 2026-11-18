import { test, expect } from '@playwright/test'
import { visit, ready, mockIri, isMobile, WA } from './helpers'

test.describe('Iri, the AI receptionist', () => {
  test('launcher shows the chef logo and opens the chat', async ({ page }) => {
    await visit(page)
    const fab = page.locator('.iri-fab')
    await expect(fab).toBeVisible()
    await expect(fab).toHaveAccessibleName(/iri/i)
    await expect(fab.locator('img')).toHaveAttribute('src', '/img/iri-chef.svg')
    await expect.poll(() => fab.locator('img').evaluate((i) => i.naturalWidth > 0)).toBe(true)
    expect((await fab.boundingBox()).width).toBeGreaterThanOrEqual(44)

    await fab.click()
    const panel = page.getByRole('dialog', { name: 'Iri' })
    await expect(panel).toBeVisible()
    await expect(fab).toHaveAttribute('aria-expanded', 'true')
    await page.waitForTimeout(500) // open animation settles
    await expect(panel.locator('.iri-head img')).toBeVisible()
    await expect(panel.locator('.iri-msg.bot').first()).toContainText('Soy Iri')
    await expect(panel.locator('.iri-quick button')).toHaveCount(5)
    await expect(page.locator('#iri-input')).toBeFocused()

    // panel fits inside the viewport on every device
    const box = await panel.boundingBox(), vp = page.viewportSize()
    expect(box.x).toBeGreaterThanOrEqual(-0.5)
    expect(box.y).toBeGreaterThanOrEqual(-0.5)
    expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 0.5)
    expect(box.y + box.height).toBeLessThanOrEqual(vp.height + 0.5)
    if (isMobile(page)) expect(box.width).toBeGreaterThanOrEqual(vp.width - 1) // full screen on phones
  })

  test('answers a typed question, renders bold, lists and safe links', async ({ page }) => {
    const calls = await mockIri(page)
    await visit(page)
    await page.locator('.iri-fab').click()
    const input = page.locator('#iri-input')
    await input.fill('¿Cuánto cuesta la caja de 6?')
    await input.press('Enter')

    await expect(page.getByTestId('iri-user-msg')).toHaveText('¿Cuánto cuesta la caja de 6?')
    const reply = page.getByTestId('iri-bot-msg').last()
    await expect(reply).toContainText('87 Bs')
    await expect(reply.locator('strong')).toHaveText('caja de 6')
    await expect(reply.locator('li')).toHaveCount(2)
    await expect(reply.locator('a[href="#build"]')).toHaveText('Arma tu caja')
    const wa = reply.locator(`a[href="${WA}"]`)
    await expect(wa).toHaveAttribute('target', '_blank')
    await expect(wa).toHaveAttribute('rel', 'noreferrer')
    await expect(page.locator('.iri-quick')).toHaveCount(0)
    await expect(input).toHaveValue('')

    expect(calls).toHaveLength(1)
    expect(calls[0].messages).toEqual([{ role: 'user', content: '¿Cuánto cuesta la caja de 6?' }])
  })

  test('quick replies send, history is kept, internal links navigate', async ({ page }) => {
    const calls = await mockIri(page)
    await visit(page)
    await page.locator('.iri-fab').click()
    await page.locator('.iri-quick button', { hasText: '¿Qué sabores tienen?' }).click()
    await expect(page.getByTestId('iri-bot-msg')).toHaveCount(1)
    await page.locator('#iri-input').fill('gracias')
    await page.locator('.iri-send').click()
    await expect(page.getByTestId('iri-bot-msg')).toHaveCount(2)
    expect(calls[1].messages.map((m) => m.role)).toEqual(['user', 'assistant', 'user'])

    // conversation survives a reload (sessionStorage)
    await page.reload()
    await ready(page)
    await page.locator('.iri-fab').click()
    await expect(page.getByRole('dialog', { name: 'Iri' })).toBeVisible()
    await expect(page.getByTestId('iri-user-msg')).toHaveCount(2)

    // in-page link closes Iri and scrolls to the builder
    await page.getByTestId('iri-bot-msg').last().locator('a[href="#build"]').click()
    await expect(page.getByRole('dialog', { name: 'Iri' })).toBeHidden()
    await expect(page.locator('#build')).toBeInViewport({ ratio: 0.1 })
  })

  test('shows a friendly fallback with WhatsApp when the API fails', async ({ page }) => {
    await mockIri(page, '', 502)
    await visit(page)
    await page.locator('.iri-fab').click()
    await page.locator('#iri-input').fill('hola')
    await page.locator('#iri-input').press('Enter')
    const reply = page.getByTestId('iri-bot-msg').last()
    await expect(reply).toContainText('WhatsApp')
    await expect(reply.locator(`a[href="${WA}"]`)).toBeVisible()
    await expect(page.locator('.iri-send')).toBeDisabled() // empty input
  })

  test('Escape and the close button close the chat; reset clears it', async ({ page }) => {
    await mockIri(page)
    await visit(page)
    const fab = page.locator('.iri-fab')
    await fab.click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Iri' })).toBeHidden()
    await expect(fab).toBeFocused()

    await fab.click()
    await page.locator('#iri-input').fill('hola')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('iri-bot-msg')).toHaveCount(1)
    await page.getByRole('button', { name: 'Nueva conversación' }).click()
    await expect(page.getByTestId('iri-bot-msg')).toHaveCount(0)
    await expect(page.locator('.iri-quick')).toBeVisible()
    await page.getByRole('button', { name: 'Cerrar chat', exact: true }).click()
    await expect(page.getByRole('dialog', { name: 'Iri' })).toBeHidden()
  })

  test('nudge bubble appears once and opens the chat', async ({ page }) => {
    await page.clock.install()
    await visit(page, { hint: true })
    await page.clock.fastForward(6500)
    const hint = page.locator('.iri-hint')
    await expect(hint).toBeVisible()
    const box = await hint.boundingBox()
    expect(box.x).toBeGreaterThanOrEqual(0)
    await hint.click()
    await expect(page.getByRole('dialog', { name: 'Iri' })).toBeVisible()
  })
})

// Real model, real answers. Runs only where the API key is configured (needs the network).
test.describe('Iri live answers @live', () => {
  test.skip(!process.env.NVIDIA_API_KEY, 'NVIDIA_API_KEY not set')
  test.setTimeout(120_000)

  const ask = async (page, q) => {
    const n = await page.getByTestId('iri-bot-msg').count()
    await page.locator('#iri-input').fill(q)
    await page.locator('#iri-input').press('Enter')
    const reply = page.getByTestId('iri-bot-msg').nth(n)
    await expect(page.locator('.iri-send')).toBeDisabled()
    await expect(page.locator('#iri-input')).toBeEditable()
    await expect.poll(async () => (await reply.textContent()).length, { timeout: 60_000 }).toBeGreaterThan(10)
    await expect(page.locator('.iri-typing')).toHaveCount(0, { timeout: 60_000 })
    await page.waitForFunction(() => !document.querySelector('.iri-log[aria-busy="true"]'), null, { timeout: 60_000 })
    return (await reply.textContent()).toLowerCase()
  }

  test('knows prices, flavours, delivery, events and stays on topic', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop-1440', 'live check runs once')
    await visit(page)
    await page.locator('.iri-fab').click()
    expect(await ask(page, '¿Cuánto cuesta la caja de 6 y la de 12?')).toMatch(/87[\s\S]*168|168[\s\S]*87/)
    expect(await ask(page, '¿Cuáles sabores son premium y cuánto suman?')).toMatch(/(biscoff[\s\S]*nutella|nutella[\s\S]*biscoff)[\s\S]*5/)
    expect(await ask(page, '¿Hacen delivery? ¿Cuánto cuesta?')).toMatch(/zona/)
    expect(await ask(page, 'Quiero alquilar el carrito para un cumpleaños')).toMatch(/whatsapp/)
    expect(await ask(page, 'How much is a single cookie?')).toMatch(/15/)
    expect(await ask(page, 'Do the cookies contain nuts? My son is allergic.')).toMatch(/whatsapp/)
  })
})
