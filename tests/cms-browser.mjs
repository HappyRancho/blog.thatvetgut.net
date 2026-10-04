import { chromium } from "playwright";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile, mkdir } from "node:fs/promises";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
const projectId = "demo-thatvetguy";
const env = await initializeTestEnvironment({
  projectId,
  firestore: {
    host: "127.0.0.1",
    port: 8085,
    rules: await readFile("firestore.rules", "utf8"),
  },
});
const server = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "4184"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      VITE_FIREBASE_PROJECT_ID: projectId,
      VITE_FIREBASE_API_KEY: "demo-test-key",
      VITE_FIREBASE_APP_ID: "1:123:web:demo",
      VITE_FIREBASE_AUTH_DOMAIN: "localhost",
      VITE_FIREBASE_DATABASE_ID: "(default)",
      VITE_APPCHECK_SITE_KEY: "",
    },
  },
);
let browser;
let page;
const errors = [];
try {
  await env.clearFirestore();
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch("http://127.0.0.1:4184/tests/cms-fixture.html")).ok)
        break;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(15000);
  page.on("dialog", (d) => d.accept());
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:4184/tests/cms-fixture.html");
  await page.waitForFunction(() => !!window.fixtureSignIn);
  const writer = await page.evaluate(() => window.fixtureSignIn("writer"));
  await page
    .getByText("This Google account has not been approved", { exact: false })
    .waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Create article", exact: true })
      .count(),
    0,
  );
  const provision = async (uid, authorId) =>
    env.withSecurityRulesDisabled(async (c) =>
      setDoc(doc(c.firestore(), "cms_users", uid), {
        role: "CO_FOUNDER",
        status: "ACTIVE",
        authorId,
      }),
    );
  await provision(writer, "dr-chirag-patidar");
  await page
    .getByRole("button", { name: "Create article", exact: true })
    .click();
  await page
    .getByLabel("Title", { exact: true })
    .fill("A useful clinic visit checklist");
  await page
    .getByLabel("Subtitle / clinical summary")
    .fill("Bring clear observations to your veterinary appointment.");
  await page
    .getByLabel("Image description", { exact: true })
    .fill("A sample green illustration for upload verification");
  const editor = page.getByRole("textbox", { name: "Article body" });
  await editor.click();
  await page.keyboard.insertText(
    "Record changes in eating, drinking and behaviour before the appointment. Ask your veterinary surgeon what to monitor and when to call again. Bring previous clinical records and a list of current medicines. Keep the discussion specific to the animal being examined.",
  );
  await page.getByRole("button", { name: "Preview formatting" }).click();
  assert.match(await page.locator(".prose").innerText(), /Record changes/);
  await page.getByRole("button", { name: "Return to editor" }).click();
  const png = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 1800;
    c.height = 1200;
    const x = c.getContext("2d");
    x.fillStyle = "#064e3b";
    x.fillRect(0, 0, c.width, c.height);
    return c.toDataURL("image/png").split(",")[1];
  });
  const field = page.locator(".image-field");
  await field.locator("input[type=file]").setInputFiles({
    name: "unsafe.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from("<svg></svg>"),
  });
  await field.getByRole("alert").filter({ hasText: "JPEG" }).waitFor();
  await field.locator("input[type=file]").setInputFiles({
    name: "sample.png",
    mimeType: "image/png",
    buffer: Buffer.from(png, "base64"),
  });
  await page.waitForFunction(() =>
    document
      .querySelector(".image-field input:not([type=file])")
      ?.value.startsWith("/media/"),
  );
  const image = await field
    .getByLabel("Image URL", { exact: true })
    .inputValue();
  const anon = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(anon, "media", image.split("/").at(-1))));
  await page
    .getByRole("button", { name: "Add reference", exact: true })
    .click();
  await page
    .locator(".reference-editor")
    .getByLabel("title", { exact: true })
    .fill("AVMA pet owner resources");
  await page
    .locator(".reference-editor")
    .getByLabel("url", { exact: true })
    .fill("https://www.avma.org/resources-tools/pet-owners");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page.getByText("Draft saved to Firebase.", { exact: true }).waitFor();
  const articleId = "a-useful-clinic-visit-checklist";
  let saved;
  await env.withSecurityRulesDisabled(async (c) => {
    saved = (await getDoc(doc(c.firestore(), "manuscripts", articleId))).data();
    const media = (
      await getDoc(doc(c.firestore(), "media", image.split("/").at(-1)))
    ).data();
    assert.equal(media.width, 1400);
    assert.ok(media.data.startsWith("data:image/webp;base64,"));
  });
  assert.match(saved.article.content, /Record changes/);
  await page.getByRole("button", { name: "Close editor", exact: true }).click();
  await page
    .getByRole("button", { name: "Submit for review", exact: true })
    .click();
  await page
    .locator(".manuscript-list .status")
    .filter({ hasText: /^SUBMITTED FOR REVIEW$/ })
    .waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Take review", exact: true })
      .count(),
    0,
  );
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page
    .getByRole("heading", { name: "Co-founder access", exact: true })
    .waitFor();
  const reviewer = await page.evaluate(() => window.fixtureSignIn("reviewer"));
  await provision(reviewer, "dr-ritesh-verma");
  await page.getByRole("button", { name: "Take review", exact: true }).click();
  await page
    .getByRole("button", { name: "Approve revision", exact: true })
    .click();
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await page.getByRole("button", { name: "Unpublish", exact: true }).waitFor();
  await assertSucceeds(getDoc(doc(anon, "publications", articleId)));
  await assertSucceeds(getDoc(doc(anon, "media", image.split("/").at(-1))));
  await page.getByRole("button", { name: "Unpublish", exact: true }).click();
  await page
    .locator(".manuscript-list .status")
    .filter({ hasText: /^UNPUBLISHED$/ })
    .waitFor();
  assert.equal(
    (await getDoc(doc(anon, "publications", articleId))).exists(),
    false,
  );
  await assertFails(getDoc(doc(anon, "media", image.split("/").at(-1))));
  await page.getByRole("button", { name: "My profile", exact: true }).click();
  await page
    .getByLabel("Biography", { exact: true })
    .fill("A pathology biography saved through the real profile editor.");
  await page.evaluate(() => window.fixtureNetwork(false));
  await page.waitForFunction(
    () => !document.querySelector("#profile-biography"),
  );
  await page.evaluate(() => window.fixtureNetwork(true));
  await page.getByLabel("Biography", { exact: true }).waitFor();
  assert.equal(
    await page.getByLabel("Biography", { exact: true }).inputValue(),
    "A pathology biography saved through the real profile editor.",
  );
  await page
    .getByRole("button", { name: "Update profile", exact: true })
    .click();
  await page
    .getByText("Your public profile was updated.", { exact: true })
    .waitFor();
  const own = (await getDoc(doc(anon, "authors", "dr-ritesh-verma"))).data();
  assert.equal(
    own.bio,
    "A pathology biography saved through the real profile editor.",
  );
  await assertFails(
    updateDoc(
      doc(
        env
          .authenticatedContext(reviewer, { email_verified: true })
          .firestore(),
        "authors",
        "dr-chirag-patidar",
      ),
      { bio: "Forged" },
    ),
  );
  await mkdir("screenshots", { recursive: true });
  await page.screenshot({
    path: "screenshots/cms-profile-mobile.png",
    fullPage: true,
  });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    "CMS mobile overflow",
  );
  await page.getByRole("button", { name: "Manuscripts", exact: true }).click();
  await page
    .getByRole("button", { name: "Import LinkedIn article", exact: true })
    .click();
  const sourceURL =
    "https://www.linkedin.com/pulse/reading-pet-food-labels-verification";
  await page
    .getByLabel("LinkedIn article URL")
    .fill("https://evil.test/pulse/content");
  await page
    .getByRole("button", { name: "Try URL import", exact: true })
    .click();
  await page
    .getByText("Use a public linkedin.com article, post or newsletter URL.", {
      exact: true,
    })
    .waitFor();
  await page.getByLabel("LinkedIn article URL").fill(sourceURL);
  await page.route("**/api/linkedin", (route) =>
    route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({
        error: "LinkedIn blocked public access to this article.",
      }),
    }),
  );
  await page
    .getByRole("button", { name: "Try URL import", exact: true })
    .click();
  await page
    .getByText("LinkedIn blocked public access to this article.", {
      exact: true,
    })
    .waitFor();
  await page.locator(".import-review > summary").click();
  assert.equal(
    await page
      .getByRole("button", { name: "Open in draft editor", exact: true })
      .isEnabled(),
    false,
  );
  await page.unroute("**/api/linkedin");
  await page.route("**/api/linkedin", async (route) => {
    assert.match(route.request().headers().authorization, /^Bearer /);
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        html: '<html><head><meta property="og:title" content="Reading labels thoughtfully"><meta property="og:description" content="An editorial verification example"></head><body><article><h2>Read the label</h2><p>Review the life stage, feeding instructions and nutritional suitability with your veterinary surgeon. This example checks that an accessible public article is imported as a private draft. #nutrition</p><script>window.__unsafe=1</script><a href="javascript:alert(1)">Unsafe link</a></article></body></html>',
      }),
    });
  });
  await page
    .getByRole("button", { name: "Try URL import", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Open in draft editor", exact: true })
    .click();
  assert.equal(
    await page.getByLabel("Title", { exact: true }).inputValue(),
    "Reading labels thoughtfully",
  );
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page.getByText("Draft saved to Firebase.", { exact: true }).waitFor();
  await env.withSecurityRulesDisabled(async (c) => {
    const imported = (
      await getDoc(
        doc(c.firestore(), "manuscripts", "reading-labels-thoughtfully"),
      )
    ).data();
    assert.equal(imported.status, "DRAFT");
    assert.equal(imported.article.sourceUrl, sourceURL);
    assert.equal(imported.article.importedBy, reviewer);
    assert.ok(imported.article.tags.includes("nutrition"));
    assert.ok(!/script|javascript:/.test(imported.article.content));
  });
  assert.equal(
    (
      await getDoc(doc(anon, "publications", "reading-labels-thoughtfully"))
    ).exists(),
    false,
  );
  await page.getByRole("button", { name: "Close editor", exact: true }).click();
  await page
    .getByRole("button", { name: "Import LinkedIn article", exact: true })
    .click();
  await page
    .getByLabel("LinkedIn article URL")
    .fill(sourceURL + "?tracking=ignored");
  await page
    .getByRole("button", { name: "Try URL import", exact: true })
    .click();
  await page
    .getByText(
      "This source URL already exists in the CMS. Open the existing manuscript instead.",
      { exact: true },
    )
    .waitFor();
  assert.equal(await page.evaluate(() => window.__unsafe), undefined);
  await env.withSecurityRulesDisabled(async (c) =>
    updateDoc(doc(c.firestore(), "cms_users", reviewer), {
      status: "INACTIVE",
    }),
  );
  await page
    .getByRole("heading", { name: "Co-founder access", exact: true })
    .waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Create article", exact: true })
      .count(),
    0,
  );
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page
    .getByRole("button", { name: "Continue with Google", exact: true })
    .waitFor();
  assert.deepEqual(errors, []);
  console.log(
    "CMS browser checks passed: denied membership, real editor/save/preview, image optimisation/privacy, independent review, publish/withdraw, own profile, cross-profile denial, revoked session, logout and unsaved text recovery after connection loss.",
  );
} catch (error) {
  await mkdir("screenshots", { recursive: true });
  await page?.screenshot({
    path: "screenshots/cms-failure.png",
    fullPage: true,
  });
  console.log("CMS errors", errors);
  console.log("CMS page", await page?.locator("body").innerText());
  throw error;
} finally {
  await browser?.close();
  server.kill("SIGTERM");
  server.unref();
  await env.cleanup();
}
