import { Database } from "bun:sqlite";
import { join, dirname } from "path";

const DB_PATH = join(dirname(import.meta.dir), "..", "data", "klassiruumid.db");

const db = new Database(DB_PATH, { create: true });

db.run("PRAGMA journal_mode = WAL");
db.run("PRAGMA foreign_keys = ON");

export async function initializeDatabase() {
  const schemaPath = join(dirname(import.meta.dir), "..", "schema.sql");
  const schemaSQL = await Bun.file(schemaPath).text();
  db.exec(schemaSQL);
  seedIfEmpty();
}

function seedIfEmpty() {
  const row = db.query("SELECT COUNT(*) as c FROM classroom").get() as { c: number };
  if (row.c > 0) return;

  // Tunni tüübid
  const insertType = db.prepare("INSERT INTO lesson_type (name, description) VALUES (?, ?)");
  for (const [name, desc] of [
    ["Loeng", "Teoreetiline loeng"],
    ["Praktikum", "Praktiline töö arvutiklassis"],
    ["Seminar", "Arutelu ja rühmatöö"],
    ["Eksam", "Eksamite läbiviimine"],
    ["Muu", "Muu tegevus"],
  ]) {
    insertType.run(name, desc);
  }

  // Arvutiklassid
  const insertClassroom = db.prepare(
    "INSERT INTO classroom (name, building, floor, capacity, has_projector, has_webcam, description) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  insertClassroom.run("A-201", "A-hoone", 2, 30, 1, 1, "Programmeerimise labor");
  insertClassroom.run("A-202", "A-hoone", 2, 25, 1, 0, "Võrgutehnoloogia klass");
  insertClassroom.run("B-101", "B-hoone", 1, 20, 0, 0, "Arvutiõppe klass");
  insertClassroom.run("B-305", "B-hoone", 3, 35, 1, 1, "Multimeedia labor");
  insertClassroom.run("C-110", "C-hoone", 1, 15, 1, 0, "Väike seminariruum");

  // Kasutajad/grupid
  const insertUser = db.prepare(
    "INSERT INTO user_or_group (name, email, role) VALUES (?, ?, ?)"
  );
  insertUser.run("Mart Tamm", "mart.tamm@kool.ee", "opetaja");
  insertUser.run("Kati Kask", "kati.kask@kool.ee", "opetaja");
  insertUser.run("TAK-21", "tak21@kool.ee", "grupp");
  insertUser.run("Admin Kasutaja", "admin@kool.ee", "admin");

  // Broneeringud
  const insertBooking = db.prepare(
    `INSERT INTO booking (classroom_id, user_id, lesson_type_id, date, start_time, end_time, participants_count, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  insertBooking.run(1, 1, 1, "2026-02-12", "08:00", "09:30", 28, "Programmeerimise loeng");
  insertBooking.run(1, 2, 2, "2026-02-12", "10:00", "11:30", 25, "Andmebaaside praktikum");
  insertBooking.run(2, 1, 2, "2026-02-12", "08:00", "09:30", 20, "Võrkude praktikum");
  insertBooking.run(3, 3, 3, "2026-02-13", "13:00", "14:30", 18, "IT seminar");
  insertBooking.run(4, 2, 1, "2026-02-14", "09:00", "10:30", 30, "Multimeedia loeng");
}

export default db;
