import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  database: "klassiruumid",
  waitForConnections: true,
  connectionLimit: 10,
});

export async function initializeDatabase() {
  await seedIfEmpty();
}

async function seedIfEmpty() {
  const [rows] = await pool.query("SELECT COUNT(*) as c FROM classroom");
  const count = (rows as any)[0].c;
  if (count > 0) return;

  // Tunni tüübid
  const types = [
    ["Loeng", "Teoreetiline loeng"],
    ["Praktikum", "Praktiline töö arvutiklassis"],
    ["Seminar", "Arutelu ja rühmatöö"],
    ["Eksam", "Eksamite läbiviimine"],
    ["Muu", "Muu tegevus"],
  ];
  for (const [name, desc] of types) {
    await pool.query("INSERT INTO lesson_type (name, description) VALUES (?, ?)", [name, desc]);
  }

  // Arvutiklassid
  const classrooms = [
    ["A-201", "A-hoone", 2, 30, true, true, "Programmeerimise labor"],
    ["A-202", "A-hoone", 2, 25, true, false, "Võrgutehnoloogia klass"],
    ["B-101", "B-hoone", 1, 20, false, false, "Arvutiõppe klass"],
    ["B-305", "B-hoone", 3, 35, true, true, "Multimeedia labor"],
    ["C-110", "C-hoone", 1, 15, true, false, "Väike seminariruum"],
  ];
  for (const c of classrooms) {
    await pool.query(
      "INSERT INTO classroom (name, building, floor, capacity, has_projector, has_webcam, description) VALUES (?, ?, ?, ?, ?, ?, ?)",
      c
    );
  }

  // Kasutajad/grupid
  const users = [
    ["Mart Tamm", "mart.tamm@kool.ee", "opetaja"],
    ["Kati Kask", "kati.kask@kool.ee", "opetaja"],
    ["TAK-21", "tak21@kool.ee", "grupp"],
    ["Admin Kasutaja", "admin@kool.ee", "admin"],
  ];
  for (const u of users) {
    await pool.query("INSERT INTO user_or_group (name, email, role) VALUES (?, ?, ?)", u);
  }

  // Broneeringud
  const bookings = [
    [1, 1, 1, "2026-02-12", "08:00", "09:30", 28, "Programmeerimise loeng"],
    [1, 2, 2, "2026-02-12", "10:00", "11:30", 25, "Andmebaaside praktikum"],
    [2, 1, 2, "2026-02-12", "08:00", "09:30", 20, "Võrkude praktikum"],
    [3, 3, 3, "2026-02-13", "13:00", "14:30", 18, "IT seminar"],
    [4, 2, 1, "2026-02-14", "09:00", "10:30", 30, "Multimeedia loeng"],
  ];
  for (const b of bookings) {
    await pool.query(
      `INSERT INTO booking (classroom_id, user_id, lesson_type_id, date, start_time, end_time, participants_count, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      b
    );
  }
}

export default pool;
