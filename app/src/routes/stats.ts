import { Hono } from "hono";
import db from "../db";
import { layout } from "../views/layout";

export const statsRoutes = new Hono();

function rq(c: any): string {
  return c.get("role") ? `?role=${c.get("role")}` : "";
}

// Abifunktsioon: ISO nädala algus- ja lõppkuupäev
function getWeekBounds(weekStr?: string): { start: string; end: string; weekLabel: string } {
  let date: Date;

  if (weekStr && /^\d{4}-W\d{2}$/.test(weekStr)) {
    const [year, week] = weekStr.split("-W").map(Number);
    // ISO nädala arvutus: leia aasta esimene nädal ja lisa nädalaid
    date = new Date(year, 0, 1 + (week - 1) * 7);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Esmaspäev
    date = new Date(date.setDate(diff));
  } else {
    // Jooksev nädal
    date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date = new Date(date.setDate(diff));
  }

  const start = date.toISOString().slice(0, 10);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 6);
  const end = endDate.toISOString().slice(0, 10);

  // Nädala number
  const jan1 = new Date(date.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((date.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  const weekLabel = `${date.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;

  return { start, end, weekLabel };
}

statsRoutes.get("/", (c) => {
  const role = c.get("role");
  const weekParam = c.req.query("week");
  const { start, end, weekLabel } = getWeekBounds(weekParam);

  // Klasside kasutus valitud nadalal
  const stats = db
    .query(
      `SELECT
          c.id,
          c.name as classroom_name,
          c.building,
          c.capacity,
          COUNT(b.id) as booking_count,
          COALESCE(ROUND(
              SUM(
                  (CAST(substr(b.end_time, 1, 2) AS REAL) + CAST(substr(b.end_time, 4, 2) AS REAL) / 60.0)
                - (CAST(substr(b.start_time, 1, 2) AS REAL) + CAST(substr(b.start_time, 4, 2) AS REAL) / 60.0)
              ), 1
          ), 0) as total_hours
       FROM classroom c
       LEFT JOIN booking b ON c.id = b.classroom_id
           AND b.date BETWEEN ? AND ?
       GROUP BY c.id
       ORDER BY total_hours DESC`
    )
    .all(start, end) as any[];

  // Üldstatistika
  const totalBookings = db.query("SELECT COUNT(*) as c FROM booking").get() as { c: number };
  const totalClassrooms = db.query("SELECT COUNT(*) as c FROM classroom").get() as { c: number };
  const totalUsers = db.query("SELECT COUNT(*) as c FROM user_or_group").get() as { c: number };

  const maxHours = 40; // 8h x 5 päeva tööndal

  const statsRows = stats
    .map((s: any) => {
      const pct = Math.min(Math.round((s.total_hours / maxHours) * 100), 100);
      return `
      <tr>
        <td>${s.classroom_name}</td>
        <td>${s.building}</td>
        <td>${s.capacity}</td>
        <td>${s.booking_count}</td>
        <td>${s.total_hours}h</td>
        <td>${pct}%</td>
        <td style="min-width:150px">
          <div class="bar" style="background:#3498db;width:${pct}%">&nbsp;</div>
        </td>
      </tr>`;
    })
    .join("");

  const content = `
    <div class="stats-grid">
      <div class="card stat-card">
        <div class="number">${totalBookings.c}</div>
        <div class="label">Broneeringuid kokku</div>
      </div>
      <div class="card stat-card">
        <div class="number">${totalClassrooms.c}</div>
        <div class="label">Arvutiklasse</div>
      </div>
      <div class="card stat-card">
        <div class="number">${totalUsers.c}</div>
        <div class="label">Kasutajaid/gruppe</div>
      </div>
    </div>

    <div class="card">
      <h2>Klasside kasutus tundides nadalas</h2>
      <form method="get" action="/stats" style="display:flex;gap:0.5rem;align-items:end;margin-bottom:1rem">
        <div>
          <label>Nadal</label>
          <input type="week" name="week" value="${weekLabel}" style="margin-bottom:0">
        </div>
        ${role !== "admin" ? "" : `<input type="hidden" name="role" value="${role}">`}
        <button type="submit" class="btn btn-primary">Naita</button>
      </form>
      <p style="color:#777;margin-bottom:1rem">Periood: ${start} kuni ${end} (kasutusprotsent 40h toonadalast)</p>

      <table>
        <thead>
          <tr>
            <th>Klass</th><th>Hoone</th><th>Kohti</th>
            <th>Broneeringuid</th><th>Tunde kokku</th><th>Kasutus %</th><th>Visuaal</th>
          </tr>
        </thead>
        <tbody>${statsRows}</tbody>
      </table>
    </div>`;

  return c.html(layout("Statistika", content, role));
});
