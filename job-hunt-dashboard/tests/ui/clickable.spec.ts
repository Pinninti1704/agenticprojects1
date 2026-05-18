import { test, expect } from '@playwright/test'

test.describe('Clickable Elements - No Crash', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('rapid tab switching multiple times does not crash', async ({ page }) => {
    const tabs = ['Topics', 'Applications', 'Study Log', 'Analytics', 'Dashboard']
    for (let i = 0; i < 3; i++) {
      for (const tab of tabs) {
        await page.getByRole('button', { name: tab }).click()
        await page.waitForTimeout(150)
      }
    }
    const heading = page.getByRole('heading', { name: 'Dashboard', exact: true })
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('navigate to every page without crash', async ({ page }) => {
    const tabs = ['Topics', 'Applications', 'Study Log', 'Analytics', 'Dashboard'] as const
    for (const tab of tabs) {
      await page.getByRole('button', { name: tab }).click()
      await page.waitForTimeout(500)
    }
    const heading = page.getByRole('heading', { name: 'Dashboard', exact: true })
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('click dashboard stat cards without crash', async ({ page }) => {
    const statCards = page.locator('main .grid.grid-cols-4 > div')
    const count = await statCards.count()
    expect(count).toBe(4)
    for (let i = 0; i < count; i++) {
      await statCards.nth(i).click()
      await page.waitForTimeout(300)
      await page.getByRole('button', { name: 'Dashboard' }).click()
      await page.waitForTimeout(300)
    }
    const heading = page.getByRole('heading', { name: 'Dashboard', exact: true })
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('study log page features work without crash', async ({ page }) => {
    await page.getByRole('button', { name: 'Study Log' }).click()
    await page.waitForTimeout(500)
    // Click calendar days
    const days = page.locator('main .grid.grid-cols-7 > div:not(:empty)')
    const dayCount = await days.count()
    if (dayCount > 7) {
      for (let i = 7; i < Math.min(dayCount, 12); i++) {
        await days.nth(i).click()
        await page.waitForTimeout(200)
      }
    }
    // Click weekly stats
    const thisWeekBox = page.locator('main').getByText('This Week').first()
    await thisWeekBox.click()
    await page.waitForTimeout(300)
    const heading = page.getByRole('heading', { name: 'Dashboard', exact: true })
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('analytics page buttons navigate without crash', async ({ page }) => {
    await page.getByRole('button', { name: 'Analytics' }).click()
    await page.waitForTimeout(500)
    const manageBtn = page.locator('main button').filter({ hasText: 'Manage Topics' }).first()
    if (await manageBtn.isVisible()) {
      await manageBtn.click()
      await page.waitForTimeout(300)
      const heading = page.getByRole('heading', { name: 'Topics', exact: true })
      await expect(heading).toBeVisible({ timeout: 5000 })
    }
  })

  test('deadline and timeline cards visible without crash', async ({ page }) => {
    await page.waitForTimeout(300)
    const deadlineCard = page.locator('main').getByText('Upcoming Deadlines').first()
    await expect(deadlineCard).toBeVisible({ timeout: 5000 })
    const timelineCard = page.locator('main').getByText('Deadline Timeline').first()
    await expect(timelineCard).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: 'Topics' }).click()
    await page.waitForTimeout(300)
    await page.getByRole('button', { name: 'Dashboard' }).click()
    await page.waitForTimeout(300)
    const heading = page.getByRole('heading', { name: 'Dashboard', exact: true })
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('topics page category collapse works without crash', async ({ page }) => {
    await page.getByRole('button', { name: 'Topics' }).click()
    await page.waitForTimeout(500)
    // Click category collapse buttons
    const catButtons = page.locator('main button').filter({ hasText: /^[A-Z]/ })
    const catCount = await catButtons.count()
    for (let i = 0; i < Math.min(catCount, 5); i++) {
      await catButtons.nth(i).click()
      await page.waitForTimeout(200)
    }
    const heading = page.getByRole('heading', { name: 'Topics', exact: true })
    await expect(heading).toBeVisible({ timeout: 5000 })
  })
})