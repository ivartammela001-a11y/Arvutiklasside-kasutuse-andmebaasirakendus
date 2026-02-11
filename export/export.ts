import { Database } from "bun:sqlite";
import { join, dirname } from "path";

const DB_PATH = join(dirname(import.meta.dir), "data", "klassiruumid.db");
const db = new Database(DB_PATH, { readonly: true });

// === EKSPORT 1: Broneeringute koondtabel CSV ===
async function exportBookingsCSV() {
  console.log("Ekspordin broneeringute kokkuvotet CSV-sse...");

  const rows = db
    .query(
      `SELECT b.date, b.start_time, b.end_time,
              c.name as classroom, u.name as user_name,
              lt.name as lesson_type, b.participants_count, b.description
       FROM booking b
       JOIN classroom c ON b.classroom_id = c.id
       JOIN user_or_group u ON b.user_id = u.id
       LEFT JOIN lesson_type lt ON b.lesson_type_id = lt.id
       ORDER BY b.date, b.start_time`
    )
    .all() as any[];

  const header = "kuupaev,algus,lopp,klass,kasutaja,tunni_tuup,osalejaid,kirjeldus";
  const csvLines = rows.map(
    (r) =>
      `${r.date},${r.start_time},${r.end_time},"${r.classroom}","${r.user_name}","${r.lesson_type || ""}",${r.participants_count},"${r.description || ""}"`
  );
  const csvContent = [header, ...csvLines].join("\n");

  const outPath = join(import.meta.dir, "bookings_summary.csv");
  await Bun.write(outPath, csvContent);
  console.log(`  Salvestatud: ${outPath}`);
  console.log(`  Ridu: ${rows.length}`);
}

// === EKSPORT 2: Top 5 kasutatumad klassid JSON ===
async function exportTop5JSON() {
  console.log("Ekspordin TOP 5 klassiruumid JSON-sse...");

  const rows = db
    .query(
      `SELECT c.name, c.building, c.capacity,
              COUNT(b.id) as broneeringuid_kokku,
              COALESCE(ROUND(SUM(
                  (CAST(substr(b.end_time,1,2) AS REAL) + CAST(substr(b.end_time,4,2) AS REAL)/60.0)
                - (CAST(substr(b.start_time,1,2) AS REAL) + CAST(substr(b.start_time,4,2) AS REAL)/60.0)
              ), 1), 0) as tunde_kokku
       FROM classroom c
       LEFT JOIN booking b ON c.id = b.classroom_id
       GROUP BY c.id
       ORDER BY broneeringuid_kokku DESC
       LIMIT 5`
    )
    .all();

  const outPath = join(import.meta.dir, "top5_classes.json");
  await Bun.write(outPath, JSON.stringify(rows, null, 2));
  console.log(`  Salvestatud: ${outPath}`);
}

// === KAIVITA EKSPORT ===
console.log("=== ANDMETE EKSPORT ===\n");
await exportBookingsCSV();
await exportTop5JSON();
console.log("\nEksport lopetatud!");
