import { test, expect } from '@playwright/test'

test('complete ShopSphere shopping journey', async ({ page }) => {
  // Open homepage
  await page.goto('/')

  // Verify homepage and products
  await expect(
    page.getByRole('heading', { name: 'Popular products' }),
  ).toBeVisible()

  // Add first product to cart
  const addButton = page.locator('button[aria-label^="Add "]').first()
  await expect(addButton).toBeVisible()
  await addButton.click()

  // Open registration form
  await page.getByRole('button', { name: 'Login / Register' }).click()
  await page.getByRole('button', { name: 'Register', exact: true }).click()

  // Register a unique test account
  const email = `e2e${Date.now()}@example.com`

  await page.getByLabel('Full name').fill('E2E Test User')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('TestPassword123')

  await page.getByRole('button', { name: 'Create Account' }).click()

  // Verify checkout becomes available
  const checkoutButton = page.getByRole('button', {
    name: 'Proceed to Checkout',
  })

  await expect(checkoutButton).toBeEnabled()

  // Place order and verify confirmation
  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Order placed successfully!')
    await dialog.accept()
  })

  await checkoutButton.click()
})