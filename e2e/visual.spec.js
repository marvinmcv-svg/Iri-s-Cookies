import { test, expect } from '@playwright/test'
import { visit, scrollThrough, mockIri, fillBox } from './helpers'

// Captures review screenshots for every device into screenshots/<project>/.
test.describe('Screens @visual', () => {
  test('capture key screens', async ({ page }, info) => {
    const dir = `screenshots/${info.project.name}`
    await mockIri(page, '¡Claro! Tenemos **9 sabores** 🍪\n- Chocolate Chip, Cookies & Cream, Red Velvet\n- Premium: **Lotus Biscoff** y **Nutella** (+5 Bs)\n\nMíralos en [Sabores](#sabores) o arma tu caja en [Arma tu caja](#build).')
    await visit(page)
    await page.waitForTimeout(1600)
    await page.screenshot({ path: `${dir}/01-hero.png` })

    const extras = page.locator('#mas .bento')
    await extras.scrollIntoViewIfNeeded()
    await scrollThrough(page)
    await extras.scrollIntoViewIfNeeded()
    await page.waitForTimeout(700)
    await extras.screenshot({ path: `${dir}/02-extras.png` })

    await page.locator('.iri-fab').click()
    await page.locator('#iri-input').fill('¿Qué sabores tienen?')
    await page.locator('#iri-input').press('Enter')
    await expect(page.getByTestId('iri-bot-msg')).toContainText('Nutella')
    await page.waitForTimeout(400)
    await page.screenshot({ path: `${dir}/03-iri-chat.png` })
    await page.keyboard.press('Escape')

    await fillBox(page)
    await page.waitForTimeout(700)
    await page.screenshot({ path: `${dir}/04-widgets-with-order-bar.png` })
  })
})
