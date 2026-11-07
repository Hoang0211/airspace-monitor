import { expect, test } from "@playwright/test";

test("loads the map and lists live drones", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");

  await expect(page.locator("canvas.maplibregl-canvas")).toBeVisible();
  await expect(page.getByRole("button", { name: /^UAV-\d+/ }).first()).toBeVisible({
    timeout: 10_000,
  });
  expect(pageErrors).toEqual([]);
});
