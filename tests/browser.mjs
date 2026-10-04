import { chromium } from "playwright";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "4173",
  ],
  { stdio: "ignore" },
);
const editorServer = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "4174"],
  { stdio: "ignore" },
);
let browser;
try {
  for (let i = 0; i < 40; i++) {
    try {
      if ((await fetch("http://127.0.0.1:4173")).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH }
      : {}),
  });
  await mkdir("screenshots", { recursive: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  page.setDefaultTimeout(12000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:4173");
  await page
    .getByRole("link", { name: "Read the story", exact: true })
    .waitFor();
  await page.screenshot({
    path: "screenshots/home-desktop.png",
    fullPage: true,
  });
  assert.equal(await page.locator(".article-grid .article-card").count(), 3);
  assert.equal(await page.locator('a[href="/admin"]').count(), 0);
  await page.getByRole("link", { name: "Read the story", exact: true }).click();
  await page
    .getByRole("heading", {
      name: "Make your next vet visit more useful",
    })
    .waitFor();
  await page
    .getByRole("button", { name: "Bookmark article", exact: true })
    .click();
  assert.equal(
    await page
      .getByRole("button", { name: "Remove bookmark", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  await page
    .getByRole("button", { name: "Toggle larger article text" })
    .click();
  assert.equal(await page.locator(".prose.large").count(), 1);
  await page
    .getByRole("button", { name: "Share article", exact: true })
    .click();
  assert.equal(await page.locator("dialog[open]").count(), 1);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("dialog[open]").count(), 0);
  await page.goto("http://127.0.0.1:4173/search?q=rabies");
  await page.getByRole("heading", { name: "The reading room." }).waitFor();
  await page
    .getByRole("link", {
      name: "Rabies prevention starts before a bite",
      exact: true,
    })
    .waitFor();
  await page.goto("http://127.0.0.1:4173/article/does-not-exist");
  await page
    .getByRole("heading", { name: "This article is not available." })
    .waitFor();
  await page.goto("http://127.0.0.1:4173/admin");
  await page.getByRole("heading", { name: "Co-founder access" }).waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Create article", exact: true })
      .count(),
    0,
  );
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("http://127.0.0.1:4173");
    await page
      .getByRole("link", { name: "Read the story", exact: true })
      .waitFor();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      `Homepage horizontal overflow at ${width}px`,
    );
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("link", { name: "All articles", exact: true }).click();
    await page.getByRole("heading", { name: "The reading room." }).waitFor();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      `Archive horizontal overflow at ${width}px`,
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:4173");
  await page
    .getByRole("link", { name: "Read the story", exact: true })
    .waitFor();
  await page.screenshot({
    path: "screenshots/home-mobile.png",
    fullPage: true,
  });
  await page.goto("http://127.0.0.1:4174/tests/editor-fixture.html");
  const editor = page.getByRole("textbox", { name: "Article body" });
  await editor.waitFor();
  assert.match(await page.getByTestId("stored").innerText(), /figcaption/);
  assert.equal(await editor.locator("aside.pro-tip").count(), 1);
  await editor.click();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.insertText("A meaningful paragraph for formatting.");
  await page.keyboard.press("ControlOrMeta+A");
  await page.getByRole("button", { name: "Bold", exact: true }).click();
  assert.match(await page.getByTestId("stored").innerText(), /<strong>/);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  assert.ok(
    !(await page.getByTestId("stored").innerText()).includes("<strong>"),
  );
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  assert.match(await page.getByTestId("stored").innerText(), /<strong>/);
  await page.getByRole("button", { name: "Paste unsafe fixture" }).click();
  const safe = await page.getByTestId("stored").innerText();
  assert.ok(!/script|javascript:|onerror|iframe|data:image/.test(safe));
  assert.equal(await page.evaluate(() => window.__unsafe), undefined);
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    "Editor mobile overflow",
  );
  await page.screenshot({
    path: "screenshots/editor-mobile.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    "Browser checks passed: desktop/mobile routes, search, bookmarks, reading controls, share dialog, unavailable article, CMS gate and horizontal overflow.",
  );
} finally {
  await browser?.close();
  server.kill("SIGTERM");
  server.unref();
  editorServer.kill("SIGTERM");
  editorServer.unref();
}
