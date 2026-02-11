import { Hono } from "hono";
import pool from "../db";
import { layout } from "../views/layout";
import { isAdmin } from "../middleware/auth";

export const classroomRoutes = new Hono();

function rq(c: any): string {
  return c.get("role") ? `?role=${c.get("role")}` : "";
}

// LIST
classroomRoutes.get("/", async (c) => {
  const role = c.get("role");
  const msg = c.req.query("msg");
  const [classrooms] = await pool.query("SELECT * FROM classroom ORDER BY building, name");

  let msgHtml = "";
  if (msg === "created") msgHtml = `<div class="alert alert-success">Klass edukalt lisatud!</div>`;
  if (msg === "updated") msgHtml = `<div class="alert alert-success">Klass edukalt muudetud!</div>`;
  if (msg === "deleted") msgHtml = `<div class="alert alert-success">Klass kustutatud!</div>`;

  const rows = (classrooms as any[])
    .map(
      (cl) => `
    <tr id="classroom-${cl.id}">
      <td>${cl.name}</td>
      <td>${cl.building}</td>
      <td>${cl.floor}. korrus</td>
      <td>${cl.capacity}</td>
      <td>${cl.has_projector ? "Jah" : "Ei"}</td>
      <td>${cl.has_webcam ? "Jah" : "Ei"}</td>
      <td class="actions">
        ${isAdmin(c) ? `<a href="/classrooms/${cl.id}/edit${rq(c)}" class="btn btn-primary btn-sm">Muuda</a>
        <button hx-post="/classrooms/${cl.id}/delete${rq(c)}"
                hx-target="#classroom-${cl.id}"
                hx-swap="outerHTML"
                hx-confirm="Kas olete kindel?"
                class="btn btn-danger btn-sm">Kustuta</button>` : ""}
      </td>
    </tr>`
    )
    .join("");

  const content = `
    ${msgHtml}
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <h2>Arvutiklassid</h2>
        ${isAdmin(c) ? `<a href="/classrooms/new${rq(c)}" class="btn btn-success">+ Lisa uus</a>` : ""}
      </div>
      ${
        (classrooms as any[]).length === 0
          ? `<p class="empty">Klasse ei leitud.</p>`
          : `<table>
        <thead>
          <tr><th>Nimi</th><th>Hoone</th><th>Korrus</th><th>Kohti</th><th>Projektor</th><th>Veebikaamera</th><th>Tegevused</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`
      }
    </div>`;

  return c.html(layout("Arvutiklassid", content, role));
});

// NEW
classroomRoutes.get("/new", (c) => {
  const role = c.get("role");
  if (!isAdmin(c)) return c.redirect(`/classrooms${rq(c)}`);

  const content = `
    <div class="card">
      <h2>Uus klass</h2>
      <form method="POST" action="/classrooms${rq(c)}">
        <div class="form-row">
          <div><label>Nimi *</label><input type="text" name="name" placeholder="nt A-201" required></div>
          <div><label>Hoone *</label><input type="text" name="building" placeholder="nt A-hoone" required></div>
        </div>
        <div class="form-row">
          <div><label>Korrus *</label><input type="number" name="floor" min="0" value="1" required></div>
          <div><label>Kohtade arv *</label><input type="number" name="capacity" min="1" value="20" required></div>
        </div>
        <div class="form-row">
          <div><label>Projektor</label><select name="has_projector"><option value="0">Ei</option><option value="1">Jah</option></select></div>
          <div><label>Veebikaamera</label><select name="has_webcam"><option value="0">Ei</option><option value="1">Jah</option></select></div>
        </div>
        <label>Kirjeldus</label>
        <textarea name="description" rows="2"></textarea>
        <div style="display:flex;gap:0.5rem">
          <button type="submit" class="btn btn-success">Salvesta</button>
          <a href="/classrooms${rq(c)}" class="btn btn-secondary">Tuhista</a>
        </div>
      </form>
    </div>`;

  return c.html(layout("Uus klass", content, role));
});

// CREATE
classroomRoutes.post("/", async (c) => {
  if (!isAdmin(c)) return c.redirect(`/classrooms${rq(c)}`);
  const body = await c.req.parseBody();
  try {
    await pool.query(
      `INSERT INTO classroom (name, building, floor, capacity, has_projector, has_webcam, description) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [String(body.name), String(body.building), Number(body.floor), Number(body.capacity), Number(body.has_projector), Number(body.has_webcam), String(body.description || "")]
    );
    return c.redirect(`/classrooms${rq(c)}&msg=created`);
  } catch (e: any) {
    return c.redirect(`/classrooms/new${rq(c)}&error=${encodeURIComponent(e.message)}`);
  }
});

// EDIT
classroomRoutes.get("/:id/edit", async (c) => {
  const role = c.get("role");
  if (!isAdmin(c)) return c.redirect(`/classrooms${rq(c)}`);
  const id = c.req.param("id");
  const [rows] = await pool.query("SELECT * FROM classroom WHERE id = ?", [id]);
  const cl = (rows as any[])[0];
  if (!cl) return c.redirect(`/classrooms${rq(c)}`);

  const content = `
    <div class="card">
      <h2>Muuda klassi "${cl.name}"</h2>
      <form method="POST" action="/classrooms/${cl.id}/edit${rq(c)}">
        <div class="form-row">
          <div><label>Nimi *</label><input type="text" name="name" value="${cl.name}" required></div>
          <div><label>Hoone *</label><input type="text" name="building" value="${cl.building}" required></div>
        </div>
        <div class="form-row">
          <div><label>Korrus *</label><input type="number" name="floor" min="0" value="${cl.floor}" required></div>
          <div><label>Kohtade arv *</label><input type="number" name="capacity" min="1" value="${cl.capacity}" required></div>
        </div>
        <div class="form-row">
          <div><label>Projektor</label><select name="has_projector"><option value="0" ${!cl.has_projector ? "selected" : ""}>Ei</option><option value="1" ${cl.has_projector ? "selected" : ""}>Jah</option></select></div>
          <div><label>Veebikaamera</label><select name="has_webcam"><option value="0" ${!cl.has_webcam ? "selected" : ""}>Ei</option><option value="1" ${cl.has_webcam ? "selected" : ""}>Jah</option></select></div>
        </div>
        <label>Kirjeldus</label>
        <textarea name="description" rows="2">${cl.description || ""}</textarea>
        <div style="display:flex;gap:0.5rem">
          <button type="submit" class="btn btn-success">Salvesta</button>
          <a href="/classrooms${rq(c)}" class="btn btn-secondary">Tuhista</a>
        </div>
      </form>
    </div>`;

  return c.html(layout("Muuda klassi", content, role));
});

// UPDATE
classroomRoutes.post("/:id/edit", async (c) => {
  if (!isAdmin(c)) return c.redirect(`/classrooms${rq(c)}`);
  const id = c.req.param("id");
  const body = await c.req.parseBody();
  try {
    await pool.query(
      `UPDATE classroom SET name=?, building=?, floor=?, capacity=?, has_projector=?, has_webcam=?, description=? WHERE id=?`,
      [String(body.name), String(body.building), Number(body.floor), Number(body.capacity), Number(body.has_projector), Number(body.has_webcam), String(body.description || ""), id]
    );
    return c.redirect(`/classrooms${rq(c)}&msg=updated`);
  } catch (e: any) {
    return c.redirect(`/classrooms/${id}/edit${rq(c)}&error=${encodeURIComponent(e.message)}`);
  }
});

// DELETE
classroomRoutes.post("/:id/delete", async (c) => {
  if (!isAdmin(c)) return c.text("Keelatud", 403);
  const id = c.req.param("id");
  await pool.query("DELETE FROM classroom WHERE id = ?", [id]);
  if (c.req.header("HX-Request")) return c.html("");
  return c.redirect(`/classrooms${rq(c)}&msg=deleted`);
});
