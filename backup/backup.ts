import { join } from "path";

const timestamp = new Date().toISOString().slice(0, 10);
const BACKUP_PATH = join(import.meta.dir, `backup_${timestamp}.sql`);

console.log("=== ANDMEBAASI VARUNDAMINE ===\n");
console.log(`Andmebaas: klassiruumid`);
console.log(`Kuupaev: ${timestamp}\n`);

// Kasutame mysqldump käsku
console.log("Meetod: mysqldump...");
try {
  const result = Bun.spawnSync(["mysqldump", "-u", "root", "--databases", "klassiruumid", "--routines", "--triggers"]);
  if (result.exitCode === 0) {
    await Bun.write(BACKUP_PATH, result.stdout);
    console.log(`  Varukoopia salvestatud: ${BACKUP_PATH}`);

    // Näita statistikat
    const mysql = (await import("mysql2/promise")).default;
    const pool = mysql.createPool({ host: "localhost", user: "root", database: "klassiruumid" });
    console.log("\n=== VARUKOOPIA STATISTIKA ===");
    for (const table of ["lesson_type", "classroom", "user_or_group", "booking"]) {
      const [rows] = await pool.query(`SELECT COUNT(*) as c FROM ${table}`);
      console.log(`  ${table}: ${(rows as any[])[0].c} rida`);
    }
    await pool.end();
  } else {
    console.error("  mysqldump viga:", new TextDecoder().decode(result.stderr));
  }
} catch (e: any) {
  console.error("  Viga:", e.message);
}

console.log("\nVarundamine lopetatud!");
