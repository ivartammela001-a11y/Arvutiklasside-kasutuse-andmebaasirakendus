import { Database } from "bun:sqlite";
import { join, dirname } from "path";

const DB_PATH = join(dirname(import.meta.dir), "data", "klassiruumid.db");
const timestamp = new Date().toISOString().slice(0, 10);
const BACKUP_SQL = join(import.meta.dir, `backup_${timestamp}.sql`);
const BACKUP_DB = join(import.meta.dir, `backup_${timestamp}.db`);

console.log("=== ANDMEBAASI VARUNDAMINE ===\n");
console.log(`Allikas: ${DB_PATH}`);
console.log(`Kuupaev: ${timestamp}\n`);

// === Meetod 1: SQL dump ===
console.log("Meetod 1: SQL dump...");

const db = new Database(DB_PATH, { readonly: true });

// Loeme skeemi
const tables = db
  .query("SELECT sql FROM sqlite_master WHERE type='table' AND sql IS NOT NULL ORDER BY rowid")
  .all() as { sql: string }[];

const triggers = db
  .query("SELECT sql FROM sqlite_master WHERE type='trigger' AND sql IS NOT NULL")
  .all() as { sql: string }[];

const indexes = db
  .query("SELECT sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL")
  .all() as { sql: string }[];

let dump = `-- Arvutiklasside andmebaasi varukoopia\n`;
dump += `-- Kuupaev: ${timestamp}\n`;
dump += `-- Genereeritud automaatselt backup.ts skriptiga\n\n`;
dump += `PRAGMA foreign_keys = ON;\n\n`;
dump += `BEGIN TRANSACTION;\n\n`;

// Tabelite struktuur ja andmed
for (const t of tables) {
  dump += `${t.sql};\n\n`;
}

// Andmed
const tableNames = db
  .query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid")
  .all() as { name: string }[];

for (const { name } of tableNames) {
  const rows = db.query(`SELECT * FROM "${name}"`).all() as Record<string, any>[];
  if (rows.length === 0) continue;

  dump += `-- Andmed: ${name} (${rows.length} rida)\n`;
  for (const row of rows) {
    const cols = Object.keys(row);
    const vals = cols.map((c) => {
      if (row[c] === null) return "NULL";
      if (typeof row[c] === "number") return String(row[c]);
      return `'${String(row[c]).replace(/'/g, "''")}'`;
    });
    dump += `INSERT INTO "${name}" (${cols.join(", ")}) VALUES (${vals.join(", ")});\n`;
  }
  dump += "\n";
}

// Triggerid
for (const t of triggers) {
  dump += `${t.sql};\n\n`;
}

// Indeksid
for (const i of indexes) {
  dump += `${i.sql};\n`;
}

dump += "\nCOMMIT;\n";

await Bun.write(BACKUP_SQL, dump);
console.log(`  SQL dump salvestatud: ${BACKUP_SQL}`);

// === Meetod 2: faili koopia ===
console.log("\nMeetod 2: Andmebaasi faili koopia...");
const sourceFile = Bun.file(DB_PATH);
await Bun.write(BACKUP_DB, sourceFile);
console.log(`  Faili koopia: ${BACKUP_DB}`);

// Naita statistikat
console.log("\n=== VARUKOOPIA STATISTIKA ===");
for (const { name } of tableNames) {
  const count = db.query(`SELECT COUNT(*) as c FROM "${name}"`).get() as { c: number };
  console.log(`  ${name}: ${count.c} rida`);
}

console.log("\nVarundamine lopetatud!");
