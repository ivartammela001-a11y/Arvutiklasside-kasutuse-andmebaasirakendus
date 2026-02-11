import mysql from "mysql2/promise";
import { join } from "path";

const pool = mysql.createPool({ host: "localhost", user: "root", database: "klassiruumid" });

// === EKSPORT 1: Broneeringute koondtabel CSV ===
async function exportBookingsCSV() {
  console.log("Ekspordin broneeringute kokkuvotet CSV-sse...");
  const [rows] = await pool.query(
    `SELECT b.date, b.start_time, b.end_time,
            c.name as classroom, u.name as user_name,
            lt.name as lesson_type, b.participants_count, b.description
     FROM booking b
     JOIN classroom c ON b.classroom_id = c.id
     JOIN user_or_group u ON b.user_id = u.id
     LEFT JOIN lesson_type lt ON b.lesson_type_id = lt.id
     ORDER BY b.date, b.start_time`
  );

  const header = "kuupaev,algus,lopp,klass,kasutaja,tunni_tuup,osalejaid,kirjeldus";
  const csvLines = (rows as any[]).map((r) => {
    const date = r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date).slice(0, 10);
    const start = String(r.start_time).slice(0, 5);
    const end = String(r.end_time).slice(0, 5);
    return `${date},${start},${end},"${r.classroom}","${r.user_name}","${r.lesson_type || ""}",${r.participants_count},"${r.description || ""}"`;
  });

  const outPath = join(import.meta.dir, "bookings_summary.csv");
  await Bun.write(outPath, [header, ...csvLines].join("\n"));
  console.log(`  Salvestatud: ${outPath}`);
  console.log(`  Ridu: ${(rows as any[]).length}`);
}

// === EKSPORT 2: Top 5 kasutatumad klassid JSON ===
async function exportTop5JSON() {
  console.log("Ekspordin TOP 5 klassiruumid JSON-sse...");
  const [rows] = await pool.query(
    `SELECT c.name, c.building, c.capacity,
            COUNT(b.id) as broneeringuid_kokku,
            COALESCE(ROUND(SUM(TIMESTAMPDIFF(MINUTE, b.start_time, b.end_time)) / 60.0, 1), 0) as tunde_kokku
     FROM classroom c
     LEFT JOIN booking b ON c.id = b.classroom_id
     GROUP BY c.id
     ORDER BY broneeringuid_kokku DESC
     LIMIT 5`
  );

  const outPath = join(import.meta.dir, "top5_classes.json");
  await Bun.write(outPath, JSON.stringify(rows, null, 2));
  console.log(`  Salvestatud: ${outPath}`);
}

console.log("=== ANDMETE EKSPORT ===\n");
await exportBookingsCSV();
await exportTop5JSON();
console.log("\nEksport lopetatud!");
await pool.end();
