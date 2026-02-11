import mysql from "mysql2/promise";
import { XMLParser } from "fast-xml-parser";
import { join } from "path";

const pool = mysql.createPool({ host: "localhost", user: "root", database: "klassiruumid" });

// === CSV IMPORT: klassiruumid ===
async function importClassroomsCSV() {
  console.log("Impordin klassiruume CSV failist...");
  const text = await Bun.file(join(import.meta.dir, "classes.csv")).text();
  const lines = text.trim().split("\n");
  let count = 0;
  for (const line of lines.slice(1)) {
    const vals = line.split(",");
    if (vals.length < 6) continue;
    try {
      await pool.query(
        `INSERT IGNORE INTO classroom (name, building, floor, capacity, has_projector, has_webcam, description) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [vals[0].trim(), vals[1].trim(), parseInt(vals[2]), parseInt(vals[3]), parseInt(vals[4]), parseInt(vals[5]), vals[6]?.trim() || null]
      );
      count++;
    } catch (e: any) {
      console.error(`  Viga: ${e.message}`);
    }
  }
  console.log(`  Imporditud ${count} klassiruumi.`);
}

// === JSON IMPORT: opetajad/grupid ===
async function importTeachersJSON() {
  console.log("Impordin opetajaid/gruppe JSON failist...");
  const data = await Bun.file(join(import.meta.dir, "teachers.json")).json();
  let count = 0;
  for (const u of data) {
    try {
      await pool.query("INSERT IGNORE INTO user_or_group (name, email, role) VALUES (?, ?, ?)", [u.name, u.email, u.role]);
      count++;
    } catch (e: any) {
      console.error(`  Viga: ${e.message}`);
    }
  }
  console.log(`  Imporditud ${count} kasutajat/gruppi.`);
}

// === XML IMPORT: broneeringud ===
async function importBookingsXML() {
  console.log("Impordin broneeringuid XML failist...");
  const xmlText = await Bun.file(join(import.meta.dir, "bookings.xml")).text();
  const parser = new XMLParser();
  const result = parser.parse(xmlText);
  const bookings = Array.isArray(result.bookings.booking) ? result.bookings.booking : [result.bookings.booking];

  let count = 0;
  for (const b of bookings) {
    try {
      await pool.query(
        `INSERT INTO booking (classroom_id, user_id, lesson_type_id, date, start_time, end_time, participants_count, description)
         VALUES (
           (SELECT id FROM classroom WHERE name = ?),
           (SELECT id FROM user_or_group WHERE email = ?),
           (SELECT id FROM lesson_type WHERE name = ?),
           ?, ?, ?, ?, ?
         )`,
        [String(b.classroom_name), String(b.user_email), String(b.lesson_type), String(b.date), String(b.start_time), String(b.end_time), Number(b.participants_count), String(b.description || "")]
      );
      count++;
    } catch (e: any) {
      console.error(`  Viga broneeringu importimisel: ${e.message}`);
    }
  }
  console.log(`  Imporditud ${count} broneeringut.`);
}

console.log("=== ANDMETE IMPORT ===\n");
await importClassroomsCSV();
await importTeachersJSON();
await importBookingsXML();
console.log("\nImport lopetatud!");
await pool.end();
