import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://92.4.130.206:3000/');
  await page.getByRole('textbox', { name: 'Email Address *' }).click();
  await page.getByRole('textbox', { name: 'Email Address *' }).click();
  await page.getByRole('textbox', { name: 'Email Address *' }).fill('admin@nsure.com');
  await page.getByRole('textbox', { name: 'Password *' }).click();
  await page.getByRole('textbox', { name: 'Password *' }).click();
  await page.getByRole('textbox', { name: 'Password *' }).fill('Asdf123$');
  await page.getByRole('button', { name: 'Login Icon Login' }).click();
  await page.getByRole('link', { name: 'Underwriters Underwriters' }).click();
  await page.getByRole('button', { name: 'New Underwriter' }).click();
  await page.getByRole('textbox', { name: 'Company Name*' }).click();
  await page.getByRole('textbox', { name: 'Email*' }).click();
  await page.getByRole('textbox', { name: 'Phone*' }).click();
  await page.getByRole('textbox', { name: 'Website*' }).click();
  await page.getByRole('textbox', { name: 'Description*' }).click();
  await page.getByRole('textbox', { name: 'Address*' }).click();
  await page.getByRole('textbox', { name: 'City / Town / Village*' }).click();
  await page.getByRole('textbox', { name: 'State*' }).click();
  await page.getByRole('textbox', { name: 'Country*' }).click();
  await page.getByRole('textbox', { name: 'Postal Code*' }).click();
  await page.getByRole('button', { name: 'Create Underwriter' }).click();
});