import { expect, test } from '@playwright/test';
test('player cards sit below dealer and card faces share a rectangle', async ({ page }, testInfo) => {
  // Pin the shoe and disable visual motion so the check only measures settled layout.
  await page.addInitScript(() => { Math.random = () => 0.5; });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.round-status')).toHaveText('התור שלך');
  const dealer = await page.locator('.dealer-area').boundingBox();
  const player = await page.locator('.playable-hands').boundingBox();
  expect.soft(player!.y, 'player hand must be below dealer hand').toBeGreaterThan(dealer!.y + dealer!.height);
  const controls = await page.locator('.action-buttons').boundingBox();
  expect(player!.y + player!.height, 'player hand must not overlap action buttons').toBeLessThan(controls!.y);
  expect(controls!.y - player!.y - player!.height, 'player hand should sit next to controls').toBeLessThan(100);
  const fronts = page.locator('.card-front');
  for (let i = 0; i < await fronts.count(); i++) {
    const front = await fronts.nth(i).boundingBox();
    const backRotation = await page.locator('.card-back').nth(i).evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m33);
    expect.soft(backRotation, 'back surface must face away from the front surface').toBeLessThan(-0.99);
    const back = await page.locator('.card-back').nth(i).boundingBox();
    expect.soft(Math.abs(front!.y - back!.y), 'front and back must overlap, not stack vertically').toBeLessThan(1);
  }
  await page.screenshot({ path: testInfo.outputPath('corrected-table.png'), fullPage: true });
});
