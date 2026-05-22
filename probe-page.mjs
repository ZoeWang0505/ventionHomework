import { chromium } from 'playwright-core'

const browser = await chromium.launch()
const page = await browser.newPage()

const errors = []
const consoleMsgs = []
page.on('pageerror', e => errors.push(`[pageerror] ${e.message}\n${e.stack ?? ''}`))
page.on('console', msg => consoleMsgs.push(`[${msg.type()}] ${msg.text()}`))

try {
  await page.goto('http://localhost:5175/', { waitUntil: 'networkidle', timeout: 15000 })
} catch (e) {
  console.log('NAV ERROR:', e.message)
}

await page.waitForTimeout(1500)

const html = await page.content()
const rootInner = await page.$eval('#app-root', el => el.innerHTML).catch(() => '<no #app-root>')

console.log('--- pageerrors ---')
console.log(errors.join('\n\n') || '(none)')
console.log('\n--- console ---')
console.log(consoleMsgs.join('\n') || '(none)')
console.log('\n--- #app-root innerHTML (first 800) ---')
console.log(rootInner.slice(0, 800))
console.log('\n--- full body length ---', html.length)

await browser.close()
