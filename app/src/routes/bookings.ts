import { Hono } from "hono";
import pool from "../db";
import { layout } from "../views/layout";
import { isAdmin } from "../middleware/auth";

export const bookingRoutes = new Hono();

function rq(c: any): string {
  return c.get("role") ? `?role=${c.get("role")}` : "";
}

// Abifunktsioon: TIME väärtuse kuvamine HH:MM formaadis
function fmtTime(t: any): string {
  if (!t) return "";
  const s = String(t);
  // MySQL TIME võib tulla "HH:MM:SS" formaadis
  return s.length > 5 ? s.slice(0, 5) : s;
}

// Abifunktsioon: DATE kuvamine YYYY-MM-DD
function fmtDate(d: any): string {
  if (!d) return "";
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

// LIST
bookingRoutes.get("/", async (c) => {
  const role = c.get("role");
  const msg = c.req.query("msg");

  const [bookings] = await pool.query(
    `SELECT b.*, c.name as classroom_name, u.name as user_name,
            lt.name as lesson_type_name
     FROM booking b
     JOIN classroom c ON b.classroom_id = c.id
     JOIN user_or_group u ON b.user_id = u.id
     LEFT JOIN lesson_type lt ON b.lesson_type_id = lt.id
     ORDER BY b.date DESC, b.start_time ASC`
  );

  let msgHtml = "";
  if (msg === "created") msgHtml = `<div class="alert alert-success">Broneering edukalt lisatud!</div>`;
  if (msg === "updated") msgHtml = `<div class="alert alert-success">Broneering edukalt muudetud!</div>`;
  if (msg === "deleted") msgHtml = `<div class="alert alert-success">Broneering kustutatud!</div>`;

  const rows = (bookings as any[])
    .map(
      (b) => `
    <tr id="booking-${b.id}">
      <td>${fmtDate(b.date)}</td>
      <td>${fmtTime(b.start_time)} - ${fmtTime(b.end_time)}</td>
      <td>${b.classroom_name}</td>
      <td>${b.user_name}</td>
      <td>${b.lesson_type_name || "-"}</td>
      <td>${b.participants_count}</td>
      <td class="actions">
        ${isAdmin(c) ? `<a href="/bookings/${b.id}/edit${rq(c)}" class="btn btn-primary btn-sm">Muuda</a>
        <button hx-post="/bookings/${b.id}/delete${rq(c)}"
                hx-target="#booking-${b.id}"
                hx-swap="outerHTML"
                hx-confirm="Kas olete kindel, et soovite selle broneeringu kustutada?"
                class="btn btn-danger btn-sm">Kustuta</button>` : ""}
      </td>
    </tr>`
    )
    .join("");

  const content = `
    ${msgHtml}
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <h2>Broneeringud</h2>
        ${isAdmin(c) ? `<a href="/bookings/new${rq(c)}" class="btn btn-success">+ Lisa uus</a>` : ""}
      </div>
      ${
        (bookings as any[]).length === 0
          ? `<p class="empty">Broneeringuid ei leitud.</p>`
          : `<table>
        <thead>
          <tr>
            <th>Kuupaev</th><th>Aeg</th><th>Klass</th><th>Kasutaja</th>
            <th>Tuup</th><th>Osalejaid</th><th>Tegevused</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`
      }
    </div>`;

  return c.html(layout("Broneeringud", content, role));
});

// NEW
bookingRoutes.get("/new", async (c) => {
  const role = c.get("role");
  if (!isAdmin(c)) return c.redirect(`/bookings${rq(c)}`);

  const [classrooms] = await pool.query("SELECT * FROM classroom ORDER BY name");
  const [users] = await pool.query("SELECT * FROM user_or_group ORDER BY name");
  const [lessonTypes] = await pool.query("SELECT * FROM lesson_type ORDER BY name");

  const content = `
    <div class="card">
      <h2>Uus broneering</h2>
      ${c.req.query("error") ? `<div class="alert alert-error">${c.req.query("error")}</div>` : ""}
      <form method="POST" action="/bookings${rq(c)}">
        <div class="form-row">
          <div>
            <label>Klass *</label>
            <select name="classroom_id" required>
              <option value="">-- Vali klass --</option>
              ${(classrooms as any[]).map((cl) => `<option value="${cl.id}">${cl.name} (${cl.building}, ${cl.capacity} kohta)</option>`).join("")}
            </select>
          </div>
          <div>
            <label>Kasutaja *</label>
            <select name="user_id" required>
              <option value="">-- Vali kasutaja --</option>
              ${(users as any[]).map((u) => `<option value="${u.id}">${u.name} (${u.role})</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div>
            <label>Tunni tuup</label>
            <select name="lesson_type_id">
              <option value="">-- Pole valitud --</option>
              ${(lessonTypes as any[]).map((lt) => `<option value="${lt.id}">${lt.name}</option>`).join("")}
            </select>
          </div>
          <div>
            <label>Kuupaev *</label>
            <input type="date" name="date" required>
          </div>
        </div>
        <div class="form-row">
          <div>
            <label>Algusaeg *</label>
            <input type="time" name="start_time" required>
          </div>
          <div>
            <label>Loppaeg *</label>
            <input type="time" name="end_time" required>
          </div>
        </div>
        <div class="form-row">
          <div>
            <label>Osalejate arv *</label>
            <input type="number" name="participants_count" min="0" value="0" required>
          </div>
          <div></div>
        </div>
        <label>Kirjeldus</label>
        <textarea name="description" rows="3"></textarea>
        <div style="display:flex;gap:0.5rem">
          <button type="submit" class="btn btn-success">Salvesta</button>
          <a href="/bookings${rq(c)}" class="btn btn-secondary">Tuhista</a>
        </div>
      </form>
    </div>`;

  return c.html(layout("Uus broneering", content, role));
});

// CREATE
bookingRoutes.post("/", async (c) => {
  const role = c.get("role");
  if (!isAdmin(c)) return c.redirect(`/bookings${rq(c)}`);

  const body = await c.req.parseBody();

  try {
    await pool.query(
      `INSERT INTO booking (classroom_id, user_id, lesson_type_id, date, start_time, end_time, participants_count, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(body.classroom_id),
        Number(body.user_id),
        body.lesson_type_id ? Number(body.lesson_type_id) : null,
        String(body.date),
        String(body.start_time),
        String(body.end_time),
        Number(body.participants_count) || 0,
        String(body.description || ""),
      ]
    );
    return c.redirect(`/bookings${rq(c)}&msg=created`);
  } catch (e: any) {
    const errorMsg = e.message.includes("kattuvad")
      ? "Broneeringuajad kattuvad! Samas klassis on juba broneering sellel ajal."
      : e.message;
    return c.redirect(`/bookings/new${rq(c)}&error=${encodeURIComponent(errorMsg)}`);
  }
});

// EDIT
bookingRoutes.get("/:id/edit", async (c) => {
  const role = c.get("role");
  if (!isAdmin(c)) return c.redirect(`/bookings${rq(c)}`);

  const id = c.req.param("id");
  const [rows] = await pool.query("SELECT * FROM booking WHERE id = ?", [id]);
  const booking = (rows as any[])[0];
  if (!booking) return c.redirect(`/bookings${rq(c)}`);

  const [classrooms] = await pool.query("SELECT * FROM classroom ORDER BY name");
  const [users] = await pool.query("SELECT * FROM user_or_group ORDER BY name");
  const [lessonTypes] = await pool.query("SELECT * FROM lesson_type ORDER BY name");

  const content = `
    <div class="card">
      <h2>Muuda broneeringut #${booking.id}</h2>
      ${c.req.query("error") ? `<div class="alert alert-error">${c.req.query("error")}</div>` : ""}
      <form method="POST" action="/bookings/${booking.id}/edit${rq(c)}">
        <div class="form-row">
          <div>
            <label>Klass *</label>
            <select name="classroom_id" required>
              ${(classrooms as any[]).map((cl) => `<option value="${cl.id}" ${cl.id === booking.classroom_id ? "selected" : ""}>${cl.name} (${cl.building}, ${cl.capacity} kohta)</option>`).join("")}
            </select>
          </div>
          <div>
            <label>Kasutaja *</label>
            <select name="user_id" required>
              ${(users as any[]).map((u) => `<option value="${u.id}" ${u.id === booking.user_id ? "selected" : ""}>${u.name} (${u.role})</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div>
            <label>Tunni tuup</label>
            <select name="lesson_type_id">
              <option value="">-- Pole valitud --</option>
              ${(lessonTypes as any[]).map((lt) => `<option value="${lt.id}" ${lt.id === booking.lesson_type_id ? "selected" : ""}>${lt.name}</option>`).join("")}
            </select>
          </div>
          <div>
            <label>Kuupaev *</label>
            <input type="date" name="date" value="${fmtDate(booking.date)}" required>
          </div>
        </div>
        <div class="form-row">
          <div>
            <label>Algusaeg *</label>
            <input type="time" name="start_time" value="${fmtTime(booking.start_time)}" required>
          </div>
          <div>
            <label>Loppaeg *</label>
            <input type="time" name="end_time" value="${fmtTime(booking.end_time)}" required>
          </div>
        </div>
        <div class="form-row">
          <div>
            <label>Osalejate arv *</label>
            <input type="number" name="participants_count" min="0" value="${booking.participants_count}" required>
          </div>
          <div></div>
        </div>
        <label>Kirjeldus</label>
        <textarea name="description" rows="3">${booking.description || ""}</textarea>
        <div style="display:flex;gap:0.5rem">
          <button type="submit" class="btn btn-success">Salvesta</button>
          <a href="/bookings${rq(c)}" class="btn btn-secondary">Tuhista</a>
        </div>
      </form>
    </div>`;

  return c.html(layout("Muuda broneeringut", content, role));
});

// UPDATE
bookingRoutes.post("/:id/edit", async (c) => {
  const role = c.get("role");
  if (!isAdmin(c)) return c.redirect(`/bookings${rq(c)}`);

  const id = c.req.param("id");
  const body = await c.req.parseBody();

  try {
    await pool.query(
      `UPDATE booking SET classroom_id = ?, user_id = ?, lesson_type_id = ?,
       date = ?, start_time = ?, end_time = ?, participants_count = ?, description = ?
       WHERE id = ?`,
      [
        Number(body.classroom_id),
        Number(body.user_id),
        body.lesson_type_id ? Number(body.lesson_type_id) : null,
        String(body.date),
        String(body.start_time),
        String(body.end_time),
        Number(body.participants_count) || 0,
        String(body.description || ""),
        id,
      ]
    );
    return c.redirect(`/bookings${rq(c)}&msg=updated`);
  } catch (e: any) {
    const errorMsg = e.message.includes("kattuvad")
      ? "Broneeringuajad kattuvad! Samas klassis on juba broneering sellel ajal."
      : e.message;
    return c.redirect(`/bookings/${id}/edit${rq(c)}&error=${encodeURIComponent(errorMsg)}`);
  }
});

// DELETE
bookingRoutes.post("/:id/delete", async (c) => {
  if (!isAdmin(c)) return c.text("Keelatud", 403);
  const id = c.req.param("id");
  await pool.query("DELETE FROM booking WHERE id = ?", [id]);
  if (c.req.header("HX-Request")) return c.html("");
  return c.redirect(`/bookings${rq(c)}&msg=deleted`);
});
