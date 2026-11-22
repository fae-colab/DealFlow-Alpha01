'use strict';

const { test, expect } = require('@playwright/test');

async function addEvidenceBackedAction(page, name = 'E2E Marina buyer') {
  await page.getByRole('button', { name: /Add action/ }).click();
  const form = page.locator('#addForm');
  await form.locator('[name="name"]').fill(name);
  await form.locator('[name="opportunityId"]').fill('E2E-DEAL-001');
  await form.locator('[name="action"]').fill('Confirm viewing with decision-maker');
  await form.locator('[name="commission"]').fill('30000');
  await form.locator('[name="pWith"]').fill('70');
  await form.locator('[name="pWithout"]').fill('30');
  await form.locator('[name="effort"]').fill('45');
  await form.locator('[name="deadline"]').fill('24');
  await form.locator('[name="evidenceStatus"]').selectOption('user_reported');
  await form.locator('[name="evidenceNote"]').fill('E2E fixture: agent supplied the scenario facts.');
  await form.getByRole('button', { name: 'Add to portfolio' }).click();
  await expect(page.locator('#actionRows')).toContainText(name);
}

async function optimize(page) {
  await page.locator('#capacity').fill('6');
  await page.getByRole('button', { name: /Optimize my attention/ }).click();
  await expect(page.locator('#runStatus')).toContainText('RECOMMEND');
  await expect(page.locator('#recommendations .decision-card')).toHaveCount(1);
}

test('dark default, manual theme switch, and preference survive reload', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('#themeToggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('dealflow-theme'))).toBe('light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.locator('#themeToggle').click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('add action, optimize portfolio, and retain the decision after refresh', async ({ page }) => {
  await page.goto('/');
  await addEvidenceBackedAction(page);
  await optimize(page);
  await expect(page.locator('#recommendations')).toContainText('Confirm viewing with decision-maker');
  await page.reload();
  await expect(page.locator('#actionRows')).toContainText('E2E Marina buyer');
  await expect(page.locator('#recommendationHistory')).toContainText('selected');
});

test('record an outcome and reconcile it to a recommendation snapshot', async ({ page }) => {
  await page.goto('/');
  await addEvidenceBackedAction(page, 'E2E Outcome buyer');
  await optimize(page);
  await page.locator('#outcomeAction').selectOption({ index: 8 });
  await page.locator('#outcomeStatus').selectOption('completed');
  await page.locator('#actualCommission').fill('12500');
  await page.locator('#actualEffort').fill('50');
  await page.locator('#outcomeNotes').fill('E2E recorded outcome');
  await page.locator('#outcomeForm button[type="submit"]').click();
  await expect(page.locator('#outcomeHistory')).toContainText('E2E recorded outcome');
  await page.locator('#reconcileSnapshot').selectOption({ index: 0 });
  await page.locator('#reconcileAction').selectOption({ index: 0 });
  await page.locator('#reconcileOutcomeEvent').selectOption({ index: 0 });
  await page.locator('#reconcileAttribution').selectOption('associated_only');
  await page.locator('#reconcileForm button[type="submit"]').click();
  await expect(page.locator('#reconciliationHistory')).toContainText('associated_only');
  await expect(page.locator('#reconciliationHistory')).toContainText('12,500 AED');
});

test('edit and remove an action through the actual table controls', async ({ page }) => {
  await page.goto('/');
  let promptIndex = 0;
  page.on('dialog', async dialog => {
    if (dialog.type() === 'prompt') {
      promptIndex += 1;
      const value = promptIndex === 2 ? 'Edited Marina buyer' : (dialog.defaultValue() || '');
      await dialog.accept(value);
    } else {
      await dialog.accept();
    }
  });
  const firstRow = page.locator('#actionRows tr').first();
  await firstRow.getByRole('button', { name: 'Edit' }).click();
  await expect(firstRow).toContainText('Edited Marina buyer');
  await firstRow.getByRole('button', { name: 'Remove' }).click();
  await expect(page.locator('#actionRows tr')).toHaveCount(7);
  await expect(page.locator('#actionRows')).not.toContainText('Edited Marina buyer');
});

test('export a backup, reset demo data, and import the backup', async ({ page }) => {
  await page.goto('/');
  await addEvidenceBackedAction(page, 'E2E Backup buyer');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#exportBtn').click();
  const download = await downloadPromise;
  const fs = require('node:fs/promises');
  const buffer = await fs.readFile(await download.path());
  expect(buffer.length).toBeGreaterThan(100);
  await page.locator('#resetBtn').click();
  await expect(page.locator('#actionRows')).not.toContainText('E2E Backup buyer');
  await page.locator('#importFile').setInputFiles({
    name: 'dealflow-e2e-backup.json',
    mimeType: 'application/json',
    buffer
  });
  await expect(page.locator('#actionRows')).toContainText('E2E Backup buyer');
});

test('mobile viewport keeps the primary controls usable without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('#themeToggle')).toBeVisible();
  await expect(page.locator('#optimizeBtn')).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    page: document.documentElement.scrollWidth
  }));
  expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport + 1);
});
