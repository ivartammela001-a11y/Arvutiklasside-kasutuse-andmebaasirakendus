import { Database } from "bun:sqlite";
import { XMLParser } from "fast-xml-parser";
import { join, dirname } from "path";

const DB_PATH = join(dirname(import.meta.dir), "data", "klassiruumid.db");
const db = new Database(DB_PATH);
db.run("PRAGMA foreign_keys = ON");

// === CSV IMPORT: klassiruumid ===
async function importClassroomsCSV() {
  console.log("Impordin klassiruume CSV failist...");
  const text = await Bun.file(join(import.meta.dir, "classes.csv")).text();
  const lines = text.trim().split("\n");

  const insert = db.prepare(
    `INSERT OR IGNORE INTO classroom (name, building, floor, capacity, has_projector, has_webcam, description)
     VALUES ($name, $building, $floor, $capacity, $has_projector, $has_webcam, $description)`
  );

  let count = 0;
  for (const line of lines.slice(1)) {
    const vals = line.split(",");
    if (vals.length < 6) continue;
    insert.run({
      $name: vals[0].trim(),
      $building: vals[1].trim(),
      $floor: parseInt(vals[2]),
      $capacity: parseInt(vals[3]),
      $has_projector: parseInt(vals[4]),
      $has_webcam: parseInt(vals[5]),
      $description: vals[6]?.trim() || null,
    });
    count++;
  }
  console.log(`  Imporditud ${count} klassiruumi.`);
}

// === JSON IMPORT: opetajad/grupid ===
async function importTeachersJSON() {
  console.log("Impordin opetajaid/gruppe JSON failist...");
  const data = await Bun.file(join(import.meta.dir, "teachers.json")).json();

  const insert = db.prepare(
    `INSERT OR IGNORE INTO user_or_group (name, email, role)
     VALUES ($name, $email, $role)`
  );

  let count = 0;
  for (const u of data) {
    insert.run({ $name: u.name, $email: u.email, $role: u.role });
    count++;
  }
  console.log(`  Imporditud ${count} kasutajat/gruppi.`);
}

// === XML IMPORT: broneeringud ===
async function importBookingsXML() {
  console.log("Impordin broneeringuid XML failist...");
  const xmlText = await Bun.file(join(import.meta.dir, "bookings.xml")).text();

  const parser = new XMLParser();
  const result = parser.parse(xmlText);

  // XMLParser tagastab ühe elemendi korral objekti, mitte massiivi
  const bookings = Array.isArray(result.bookings.booking)
    ? result.bookings.booking
    : [result.bookings.booking];

  const insert = db.prepare(`
    INSERT INTO booking (classroom_id, user_id, lesson_type_id, date, start_time, end_time, participants_count, description)
    VALUES (
      (SELECT id FROM classroom WHERE name = $classroom_name),
      (SELECT id FROM user_or_group WHERE email = $user_email),
      (SELECT id FROM lesson_type WHERE name = $lesson_type),
      $date, $start_time, $end_time, $participants_count, $description
    )
  `);

  let count = 0;
  for (const b of bookings) {
    try {
      insert.run({
        $classroom_name: String(b.classroom_name),
        $user_email: String(b.user_email),
        $lesson_type: String(b.lesson_type),
        $date: String(b.date),
        $start_time: String(b.start_time),
        $end_time: String(b.end_time),
        $participants_count: Number(b.participants_count),
        $description: String(b.description || ""),
      });
      count++;
    } catch (e: any) {
      console.error(`  Viga broneeringu importimisel: ${e.message}`);
    }
  }
  console.log(`  Imporditud ${count} broneeringut.`);
}

// === KAIVITA IMPORT ===
console.log("=== ANDMETE IMPORT ===\n");
await importClassroomsCSV();
await importTeachersJSON();
await importBookingsXML();
console.log("\nImport lopetatud!");
