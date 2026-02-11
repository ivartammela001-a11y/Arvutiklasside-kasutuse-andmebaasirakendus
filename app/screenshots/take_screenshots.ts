import { chromium } from "playwright";
import { join } from "path";

const BASE = "http://localhost:3001";
const DIR = import.meta.dir;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

async function screenshot(url: string, name: string) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.screenshot({ path: join(DIR, name), fullPage: true });
  console.log(`  Salvestatud: ${name}`);
}

console.log("=== EKRAANIPILTIDE TEGEMINE ===\n");

// 1. Avaleht
await screenshot(`${BASE}/?role=admin`, "01_avaleht.png");

// 2. Broneeringute nimekiri
await screenshot(`${BASE}/bookings?role=admin`, "02_broneeringud.png");

// 3. Uue broneeringu lisamine
await screenshot(`${BASE}/bookings/new?role=admin`, "03_uus_broneering.png");

// 4. Broneeringu muutmine
await screenshot(`${BASE}/bookings/1/edit?role=admin`, "04_muuda_broneering.png");

// 5. Arvutiklassid
await screenshot(`${BASE}/classrooms?role=admin`, "05_klassid.png");

// 6. Kasutajad
await screenshot(`${BASE}/users?role=admin`, "06_kasutajad.png");

// 7. Statistika
await screenshot(`${BASE}/stats?role=admin&week=2026-W07`, "07_statistika.png");

// 8. Viewer roll (nupud peidetud)
await screenshot(`${BASE}/bookings?role=viewer`, "08_viewer_broneeringud.png");

await browser.close();
console.log("\nKoik ekraanipildid tehtud!");
