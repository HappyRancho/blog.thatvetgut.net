import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
const dir = "research";
await mkdir(dir, { recursive: true });
const sites = [
  ["public", "https://www.thatvetguy.net/"],
  ["author-ritesh", "https://www.thatvetguy.net/ritesh.html"],
  ["author-shivam", "https://www.thatvetguy.net/Shivam.html"],
  ["author-deepesh-c", "https://www.thatvetguy.net/deepesh-c.html"],
  ["author-deepesh-m", "https://www.thatvetguy.net/deepesh-m.html"],
  ["author-amaan", "https://www.thatvetguy.net/amaan.html"],
  ["author-chirag", "https://www.thatvetguy.net/chirag.html"],
  ["author-experts", "https://www.thatvetguy.net/experts.html"],
  ["cms", "https://blog.thatvetguy.net/admin"],
  ["public-about", "https://www.thatvetguy.net/about"],
  ["public-team", "https://www.thatvetguy.net/team"],
  ["petmd", "https://www.petmd.com/"],
  ["petmd-dog", "https://www.petmd.com/dog"],
  [
    "petmd-vomiting",
    "https://www.petmd.com/dog/symptoms/vomiting-dogs-causes-treatment-and-related-symptoms",
  ],
  ["vca", "https://vcahospitals.com/know-your-pet"],
  ["akc", "https://www.akc.org/expert-advice/"],
  ["spruce", "https://www.thesprucepets.com/"],
  ["preventive", "https://www.preventivevet.com/"],
  ["dailypaws", "https://www.dailypaws.com/"],
  ["happypet", "https://www.happypet.care/"],
  ["dogsee", "https://www.dogseechew.in/blog"],
  ["wip", "https://www.worksinprogress.co/"],
  ["ghost", "https://ghost.org/help/using-the-editor/"],
  ["tiptap", "https://tiptap.dev/docs/editor/getting-started/overview"],
];
const browser = await chromium.launch({ headless: true });
const summary = [];
for (const [id, url] of sites) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
  });
  try {
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForTimeout(1800);
    const data = await page.evaluate(() => ({
      url: location.href,
      title: document.title,
      canonical: document.querySelector("link[rel=canonical]")?.href,
      headings: [...document.querySelectorAll("h1,h2,h3")]
        .slice(0, 60)
        .map((n) => n.textContent.trim()),
      text: document.body.innerText.slice(0, 25000),
      links: [...document.querySelectorAll("a[href]")]
        .map((a) => ({ text: a.innerText.trim().slice(0, 100), url: a.href }))
        .filter((a) => a.text)
        .slice(0, 180),
      images: [...document.images].map((i) => ({ src: i.src, alt: i.alt })),
      font: getComputedStyle(document.querySelector("h1") || document.body)
        .fontFamily,
    }));
    data.status = response?.status();
    await writeFile(`${dir}/${id}.json`, JSON.stringify(data, null, 2));
    await page.screenshot({ path: `${dir}/${id}.png`, fullPage: false });
    summary.push({ id, url: data.url, status: data.status, title: data.title });
    // Inspect a real article when accessible, rather than relying on homepages alone.
    if (!["cms", "ghost", "tiptap"].includes(id)) {
      const link = data.links.find(
        (a) =>
          a.url.startsWith(new URL(data.url).origin) &&
          a.text.length > 30 &&
          !/privacy|cookie|terms|contact|newsletter/i.test(a.text) &&
          a.url !== data.url,
      );
      if (link) {
        await page.goto(link.url, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        await writeFile(
          `${dir}/${id}-article.txt`,
          `${page.url()}\n${await page.locator("body").innerText()}`,
        );
        await page.screenshot({ path: `${dir}/${id}-article.png` });
      }
    }
  } catch (e) {
    summary.push({ id, url, error: e.message });
  } finally {
    await page.close();
  }
}
await browser.close();
for (const c of ["publications", "manuscripts", "cms_users", "authors"]) {
  try {
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/adroit-bus-1ghtt/databases/ai-studio-thatvetguy-7ee5cb09-c3e8-4d7e-8c1c-f5ef3b5df638/documents/${c}?pageSize=2`,
    );
    const data = await r.json();
    summary.push({
      collection: c,
      status: r.status,
      count: data.documents?.length || 0,
      fields:
        c === "publications"
          ? data.documents?.map((d) => Object.keys(d.fields || {}))
          : undefined,
      error: data.error?.message,
    });
  } catch (e) {
    summary.push({ collection: c, error: e.message });
  }
}
await writeFile(`${dir}/summary.json`, JSON.stringify(summary, null, 2));
console.log(summary);

const clinicalSources = [
  "https://www.avma.org/resources-tools/pet-owners",
  "https://www.merckvetmanual.com/clinical-pathology-and-procedures",
  "https://wsava.org/global-guidelines/global-nutrition-guidelines/",
  "https://wsava.org/global-guidelines/vaccination-guidelines/",
  "https://www.avma.org/resources-tools/pet-owners/petcare/household-hazards",
  "https://www.who.int/news-room/fact-sheets/detail/rabies",
  "https://catfriendly.com/cat-care-at-home/cat-carrier-tips/",
  "https://www.woah.org/en/what-we-do/standards/codes-and-manuals/",
];
const sourceResults = [];
for (const url of clinicalSources) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(12000) });
    const text = await r.text();
    sourceResults.push({
      url,
      final: r.url,
      status: r.status,
      title: text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1],
    });
  } catch (e) {
    sourceResults.push({ url, error: e.message });
  }
}
await writeFile(
  `${dir}/clinical-sources.json`,
  JSON.stringify(sourceResults, null, 2),
);
