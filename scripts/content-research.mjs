import { mkdir, writeFile } from "node:fs/promises";
const sources = {
  heatvca: "https://vcahospitals.com/know-your-pet/heat-stroke-in-dogs",
  lepto: "https://vcahospitals.com/know-your-pet/leptospirosis-in-dogs",
  carrierVca:
    "https://vcahospitals.com/know-your-pet/cat-behavior-and-training---traveling-air-travel",
  pain: "https://www.fda.gov/animal-veterinary/animal-health-literacy/get-facts-about-pain-relievers-pets",
  farm: "https://www.woah.org/en/what-we-do/standards/codes-and-manuals/terrestrial-code-online-access/",
  vaccination: "https://wsava.org/global-guidelines/vaccination-guidelines/",
  nutrition: "https://wsava.org/global-guidelines/global-nutrition-guidelines/",
  dental:
    "https://www.avma.org/resources-tools/pet-owners/petcare/pet-dental-care",
  heat: "https://www.rvc.ac.uk/small-animal-vet/general-practice/heatstroke-in-dogs",
  rabies: "https://www.who.int/news-room/fact-sheets/detail/rabies",
  hygiene: "https://www.cdc.gov/healthy-pets/about/index.html",
  raw: "https://www.cdc.gov/healthy-pets/about/pet-food-safety.html",
  weight:
    "https://www.aaha.org/resources/2021-aaha-nutrition-and-weight-management-guidelines/",
  labels:
    "https://www.fda.gov/animal-veterinary/animal-health-literacy/pet-food-labels-general",
  blood: "https://vcahospitals.com/know-your-pet/complete-blood-count",
  urine: "https://vcahospitals.com/know-your-pet/urinalysis",
  antibiotics:
    "https://www.woah.org/en/what-we-do/global-initiatives/antimicrobial-resistance/",
  puppy: "https://vcahospitals.com/know-your-pet/vaccination-failures-in-dogs",
  stool: "https://vcahospitals.com/know-your-pet/fecal-flotation",
  calf: "https://extension.psu.edu/colostrum-management-for-dairy-calves",
  mastitis:
    "https://extension.umn.edu/dairy-milking-cows/mastitis-prevention-and-control",
  livestockheat:
    "https://extension.umn.edu/dairy-milking-cows/heat-stress-dairy-cattle",
  biosecurity:
    "https://www.aphis.usda.gov/livestock-poultry-disease/biosecurity",
  colic: "https://www.acvs.org/large-animal/colic-in-horses/",
  surgery:
    "https://vcahospitals.com/know-your-pet/post-operative-instructions-in-dogs",
  catpain: "https://icatcare.org/advice/how-to-tell-if-your-cat-is-in-pain/",
  cruciate:
    "https://www.acvs.org/small-animal/cranial-cruciate-ligament-disease/",
  carrier: "https://catfriendly.com/cat-care-at-home/cat-carrier-tips/",
  poison:
    "https://www.avma.org/resources-tools/pet-owners/petcare/household-hazards",
  wildlife: "https://www.rspca.org.uk/adviceandwelfare/wildlife/injuredanimals",
  leptospirosis: "https://www.cdc.gov/leptospirosis/about/index.html",
  petmd: "https://www.petmd.com/",
};
const images = {
  bird: "photo-1444464666168-49d633b86797",
  dog: "photo-1552053831-71594a27632d",
  cat: "photo-1514888286974-6c03e2ca1dba",
  puppy: "photo-1558788353-f76d92427f16",
  kitten: "photo-1573865526739-10659fec78a5",
  horse: "photo-1553284965-83fd3e82fa5a",
  cow: "photo-1546445317-29f4545e9d53",
};
await mkdir("content-research", { recursive: true });
const result = [];
await Promise.all(
  Object.entries(sources).map(async ([id, url]) => {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
      const html = await r.text();
      const text = html
        .replace(/<(script|style|svg)[\s\S]*?<\/\1>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ");
      await writeFile(
        `content-research/${id}.txt`,
        url + "\nHTTP " + r.status + "\n" + text,
      );
      result.push({ id, url, status: r.status, final: r.url });
    } catch (e) {
      result.push({ id, url, error: e.message });
    }
  }),
);
for (const [id, photo] of Object.entries(images)) {
  const url = `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=800&q=80`;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    result.push({
      image: id,
      url,
      status: r.status,
      type: r.headers.get("content-type"),
    });
    if (r.ok)
      await writeFile(
        `content-research/${id}.jpg`,
        Buffer.from(await r.arrayBuffer()),
      );
  } catch (e) {
    result.push({ image: id, error: e.message });
  }
}
await writeFile(
  "content-research/summary.json",
  JSON.stringify(result, null, 2),
);
console.log(result);
