import { Hono } from "hono";
import db from "../db";
import { layout } from "../views/layout";
import { isAdmin, roleQuery } from "../middleware/auth";

export const bookingRoutes = new Hono();

// Abifunktsioon: lingid säilitavad rolli
function rq(c: any): string {
  return c.get("role") ? `?role=${c.get("role")}` : "";
}

// LIST - broneeringute nimekiri
bookingRoutes.get("/", (c) => {
  const role = c.get("role");
  const msg = c.req.query("msg");
  const bookings = db
    .query(
      `SELECT b.*, c.name as classroom_name, u.name as user_name,
              lt.name as lesson_type_name
       FROM booking b
       JOIN classroom c ON b.classroom_id = c.id
       JOIN user_or_group u ON b.user_id = u.id
       LEFT JOIN lesson_type lt ON b.lesson_type_id = lt.id
       ORDER BY b.date DESC, b.start_time ASC`
    )
    .all() as any[];

  let msgHtml = "";
  if (msg === "created") msgHtml = `<div class="alert alert-success">Broneering edukalt lisatud!</div>`;
  if (msg === "updated") msgHtml = `<div class="alert alert-success">Broneering edukalt muudetud!</div>`;
  if (msg === "deleted") msgHtml = `<div class="alert alert-success">Broneering kustutatud!</div>`;

  const rows = bookings
    .map(
      (b: any) => `
    <tr id="booking-${b.id}">
      <td>${b.date}</td>
      <td>${b.start_time} - ${b.end_time}</td>
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
        bookings.length === 0
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

// NEW - uue broneeringu vorm
bookingRoutes.get("/new", (c) => {
  const role = c.get("role");
  if (!isAdmin(c)) return c.redirect(`/bookings${rq(c)}`);

  const classrooms = db.query("SELECT * FROM classroom ORDER BY name").all() as any[];
  const users = db.query("SELECT * FROM user_or_group ORDER BY name").all() as any[];
  const lessonTypes = db.query("SELECT * FROM lesson_type ORDER BY name").all() as any[];

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
              ${classrooms.map((cl: any) => `<option value="${cl.id}">${cl.name} (${cl.building}, ${cl.capacity} kohta)</option>`).join("")}
            </select>
          </div>
          <div>
            <label>Kasutaja *</label>
            <select name="user_id" required>
              <option value="">-- Vali kasutaja --</option>
              ${users.map((u: any) => `<option value="${u.id}">${u.name} (${u.role})</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div>
            <label>Tunni tuup</label>
            <select name="lesson_type_id">
              <option value="">-- Pole valitud --</option>
              ${lessonTypes.map((lt: any) => `<option value="${lt.id}">${lt.name}</option>`).join("")}
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

// CREATE - broneeringu loomine
bookingRoutes.post("/", async (c) => {
  const role = c.get("role");
  if (!isAdmin(c)) return c.redirect(`/bookings${rq(c)}`);

  const body = await c.req.parseBody();
  const classroomId = Number(body.classroom_id);
  const userId = Number(body.user_id);
  const lessonTypeId = body.lesson_type_id ? Number(body.lesson_type_id) : null;
  const date = String(body.date);
  const startTime = String(body.start_time);
  const endTime = String(body.end_time);
  const participantsCount = Number(body.participants_count) || 0;
  const description = String(body.description || "");

  try {
    db.query(
      `INSERT INTO booking (classroom_id, user_id, lesson_type_id, date, start_time, end_time, participants_count, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(classroomId, userId, lessonTypeId, date, startTime, endTime, participantsCount, description);

    return c.redirect(`/bookings${rq(c)}&msg=created`);
  } catch (e: any) {
    const errorMsg = e.message.includes("kattuvad")
      ? "Broneeringuajad kattuvad! Samas klassis on juba broneering sellel ajal."
      : e.message;
    return c.redirect(`/bookings/new${rq(c)}&error=${encodeURIComponent(errorMsg)}`);
  }
});

// EDIT - broneeringu muutmise vorm
bookingRoutes.get("/:id/edit", (c) => {
  const role = c.get("role");
  if (!isAdmin(c)) return c.redirect(`/bookings${rq(c)}`);

  const id = c.req.param("id");
  const booking = db.query("SELECT * FROM booking WHERE id = ?").get(id) as any;
  if (!booking) return c.redirect(`/bookings${rq(c)}`);

  const classrooms = db.query("SELECT * FROM classroom ORDER BY name").all() as any[];
  const users = db.query("SELECT * FROM user_or_group ORDER BY name").all() as any[];
  const lessonTypes = db.query("SELECT * FROM lesson_type ORDER BY name").all() as any[];

  const content = `
    <div class="card">
      <h2>Muuda broneeringut #${booking.id}</h2>
      ${c.req.query("error") ? `<div class="alert alert-error">${c.req.query("error")}</div>` : ""}
      <form method="POST" action="/bookings/${booking.id}/edit${rq(c)}">
        <div class="form-row">
          <div>
            <label>Klass *</label>
            <select name="classroom_id" required>
              ${classrooms.map((cl: any) => `<option value="${cl.id}" ${cl.id === booking.classroom_id ? "selected" : ""}>${cl.name} (${cl.building}, ${cl.capacity} kohta)</option>`).join("")}
            </select>
          </div>
          <div>
            <label>Kasutaja *</label>
            <select name="user_id" required>
              ${users.map((u: any) => `<option value="${u.id}" ${u.id === booking.user_id ? "selected" : ""}>${u.name} (${u.role})</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div>
            <label>Tunni tuup</label>
            <select name="lesson_type_id">
              <option value="">-- Pole valitud --</option>
              ${lessonTypes.map((lt: any) => `<option value="${lt.id}" ${lt.id === booking.lesson_type_id ? "selected" : ""}>${lt.name}</option>`).join("")}
            </select>
          </div>
          <div>
            <label>Kuupaev *</label>
            <input type="date" name="date" value="${booking.date}" required>
          </div>
        </div>
        <div class="form-row">
          <div>
            <label>Algusaeg *</label>
            <input type="time" name="start_time" value="${booking.start_time}" required>
          </div>
          <div>
            <label>Loppaeg *</label>
            <input type="time" name="end_time" value="${booking.end_time}" required>
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

// UPDATE - broneeringu uuendamine
bookingRoutes.post("/:id/edit", async (c) => {
  const role = c.get("role");
  if (!isAdmin(c)) return c.redirect(`/bookings${rq(c)}`);

  const id = c.req.param("id");
  const body = await c.req.parseBody();

  try {
    db.query(
      `UPDATE booking SET classroom_id = ?, user_id = ?, lesson_type_id = ?,
       date = ?, start_time = ?, end_time = ?, participants_count = ?, description = ?
       WHERE id = ?`
    ).run(
      Number(body.classroom_id),
      Number(body.user_id),
      body.lesson_type_id ? Number(body.lesson_type_id) : null,
      String(body.date),
      String(body.start_time),
      String(body.end_time),
      Number(body.participants_count) || 0,
      String(body.description || ""),
      id
    );

    return c.redirect(`/bookings${rq(c)}&msg=updated`);
  } catch (e: any) {
    const errorMsg = e.message.includes("kattuvad")
      ? "Broneeringuajad kattuvad! Samas klassis on juba broneering sellel ajal."
      : e.message;
    return c.redirect(`/bookings/${id}/edit${rq(c)}&error=${encodeURIComponent(errorMsg)}`);
  }
});

// DELETE - broneeringu kustutamine
bookingRoutes.post("/:id/delete", (c) => {
  if (!isAdmin(c)) return c.text("Keelatud", 403);

  const id = c.req.param("id");
  db.query("DELETE FROM booking WHERE id = ?").run(id);

  // HTMX puhul tagastab tühja (rida eemaldatakse), muidu redirect
  if (c.req.header("HX-Request")) {
    return c.html("");
  }
  return c.redirect(`/bookings${rq(c)}&msg=deleted`);
});
