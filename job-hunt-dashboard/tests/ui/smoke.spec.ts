import { test, expect } from '@playwright/test'

test.describe('Job Hunt Dashboard - Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('page loads with all nav items', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Topics' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Applications' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Study Log' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Analytics' })).toBeVisible()
  })

  test('sidebar navigation switches pages', async ({ page }) => {
    await page.getByRole('button', { name: 'Topics' }).click()
    await expect(page.getByRole('heading', { name: 'Topics', exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Applications' }).click()
    await expect(page.getByRole('heading', { name: 'Applications', exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Study Log' }).click()
    await expect(page.getByRole('heading', { name: 'Study Log' })).toBeVisible()

    await page.getByRole('button', { name: 'Analytics' }).click()
    await expect(page.getByRole('heading', { name: 'Analytics', exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Dashboard' }).click()
    await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible()
  })

  test('quick action buttons navigate to correct pages', async ({ page }) => {
    const main = page.locator('main')

    // "Add Topic" navigates to Topics
    await main.locator('button:has-text("Add Topic")').click()
    await expect(page.getByRole('heading', { name: 'Topics', exact: true })).toBeVisible()

    // Back to dashboard
    await page.getByRole('button', { name: 'Dashboard' }).click()

    // "Log Application" navigates to Applications
    await main.locator('button:has-text("Log Application")').click()
    await expect(page.getByRole('heading', { name: 'Applications', exact: true })).toBeVisible()

    // Back to dashboard
    await page.getByRole('button', { name: 'Dashboard' }).click()

    // "Log Study" navigates to Study Log
    await main.locator('button:has-text("Log Study")').click()
    await expect(page.getByRole('heading', { name: 'Study Log' })).toBeVisible()
  })

  test('can create a topic and see it in the list', async ({ page }) => {
    const main = page.locator('main')

    await page.getByRole('button', { name: 'Topics' }).click()
    // The button says "Add Topic" (not "Add New Topic"), which opens a modal with title "Add New Topic"
    await main.locator('button:has-text("Add Topic")').click()

    // Wait for modal to appear
    await expect(page.getByText('Add New Topic').first()).toBeVisible()
    await page.getByPlaceholder('e.g. Arrays & Hashing').fill('Playwright Test Topic')
    // Topic form submit button is inside a form within the modal
    await page.locator('form').getByRole('button', { name: 'Add Topic' }).click()

    await expect(main.locator('text=Playwright Test Topic')).toBeVisible()
  })

  test('can add a job application', async ({ page }) => {
    const main = page.locator('main')

    await page.getByRole('button', { name: 'Applications' }).click()
    await main.locator('button:has-text("Add Application")').click()

    // Wait for modal form to appear
    await page.getByPlaceholder('e.g. Google').fill('Playwright Corp')
    await page.getByPlaceholder('e.g. Senior Software Engineer').fill('QA Engineer')
    // Submit button is inside a form within the modal
    await page.locator('form').getByRole('button', { name: 'Add Application' }).click()

    await expect(main.locator('text=Playwright Corp')).toBeVisible()
  })

  test('study log page loads and has form elements', async ({ page }) => {
    await page.getByRole('button', { name: 'Study Log' }).click()
    await expect(page.locator('main').locator('text=Log Study Session').first()).toBeVisible()
  })

  test('dashboard shows stats bar with data labels', async ({ page }) => {
    await page.getByRole('button', { name: 'Dashboard' }).click()
    await expect(page.locator('main').locator('text=Topics Covered').first()).toBeVisible()
  })
})