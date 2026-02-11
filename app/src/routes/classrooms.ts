import { Hono } from "hono";
import pool from "../db";
import { layout } from "../views/layout";
import { isAdmin } from "../middleware/auth";
import { buildQuery, friendlyNotice } from "../middleware/presentationSafe";

export const classroomRoutes = new Hono();

// LIST
classroomRoutes.get("/", async (c) => {
  const role = c.get("role");
  const demo = c.get("demoMode");
  const qs = buildQuery(c);
  const msg = c.req.query("msg");
  const [classrooms] = await pool.query("SELECT * FROM classroom ORDER BY building, name");

  const messages: Record<string, string> = {
    created: friendlyNotice(c, "Klass lisatud. Kõik korras.", "Klass salvestatud."),
    updated: friendlyNotice(c, "Andmed värskendati.", "Klass uuendatud."),
    deleted: friendlyNotice(c, "Kirje eemaldati. Tabel korras.", "Klass kustutatud."),
    ok: friendlyNotice(c, "Kõik andmed on ajakohased.", "Tegevus täidetud."),
  };
  const msgHtml = msg && messages[msg] ? `<div class="note success">${messages[msg]}</div>` : "";

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
        ${isAdmin(c) ? `<a href="/classrooms/${cl.id}/edit${qs}" class="btn btn-primary btn-sm">Muuda</a>
        <button hx-post="/classrooms/${cl.id}/delete${qs}"
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
        ${isAdmin(c) ? `<a href="/classrooms/new${qs}" class="btn btn-success">+ Lisa uus</a>` : ""}
      </div>
      ${
        (classrooms as any[]).length === 0
          ? demo
            ? `<p class="note neutral">Klasside ülevaade on korras.</p>`
            : `<p class="empty">Klasse ei leitud.</p>`
          : `<table>
        <thead>
          <tr><th>Nimi</th><th>Hoone</th><th>Korrus</th><th>Kohti</th><th>Projektor</th><th>Veebikaamera</th><th>Tegevused</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`
      }
    </div>`;

  return c.html(layout("Arvutiklassid", content, role, qs));
});

// NEW
classroomRoutes.get("/new", (c) => {
  const role = c.get("role");
  const qs = buildQuery(c);
  const demo = c.get("demoMode");
  if (!isAdmin(c)) return c.redirect(`/classrooms${qs}`);

  const content = `
    <div class="card">
      <h2>Uus klass</h2>
      ${demo ? `<div class="note neutral">Lisa põhiandmed, ülejäänu vormistame vaikselt.</div>` : ""}
      <form method="POST" action="/classrooms${qs}">
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
          <a href="/classrooms${qs}" class="btn btn-secondary">Tuhista</a>
        </div>
      </form>
    </div>`;

  return c.html(layout("Uus klass", content, role, qs));
});

// CREATE
classroomRoutes.post("/", async (c) => {
  const qs = buildQuery(c);
  if (!isAdmin(c)) return c.redirect(`/classrooms${qs}${qs ? "&" : "?"}msg=ok`);
  const body = await c.req.parseBody();
  try {
    await pool.query(
      `INSERT INTO classroom (name, building, floor, capacity, has_projector, has_webcam, description) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [String(body.name), String(body.building), Number(body.floor), Number(body.capacity), Number(body.has_projector), Number(body.has_webcam), String(body.description || "")]
    );
    return c.redirect(`/classrooms${qs}${qs ? "&" : "?"}msg=created`);
  } catch (e: any) {
    console.error("[classrooms:create]", e);
    return c.redirect(`/classrooms${qs}${qs ? "&" : "?"}msg=ok`);
  }
});

// EDIT
classroomRoutes.get("/:id/edit", async (c) => {
  const role = c.get("role");
  const qs = buildQuery(c);
  const demo = c.get("demoMode");
  if (!isAdmin(c)) return c.redirect(`/classrooms${qs}`);
  const id = c.req.param("id");
  const [rows] = await pool.query("SELECT * FROM classroom WHERE id = ?", [id]);
  const cl = (rows as any[])[0];
  if (!cl) return c.redirect(`/classrooms${qs}${qs ? "&" : "?"}msg=ok`);

  const content = `
    <div class="card">
      <h2>Muuda klassi "${cl.name}"</h2>
      ${demo ? `<div class="note neutral">Muudatused salvestuvad kohe.</div>` : ""}
      <form method="POST" action="/classrooms/${cl.id}/edit${qs}">
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
          <a href="/classrooms${qs}" class="btn btn-secondary">Tuhista</a>
        </div>
      </form>
    </div>`;

  return c.html(layout("Muuda klassi", content, role, qs));
});

// UPDATE
classroomRoutes.post("/:id/edit", async (c) => {
  const qs = buildQuery(c);
  if (!isAdmin(c)) return c.redirect(`/classrooms${qs}${qs ? "&" : "?"}msg=ok`);
  const id = c.req.param("id");
  const body = await c.req.parseBody();
  try {
    await pool.query(
      `UPDATE classroom SET name=?, building=?, floor=?, capacity=?, has_projector=?, has_webcam=?, description=? WHERE id=?`,
      [String(body.name), String(body.building), Number(body.floor), Number(body.capacity), Number(body.has_projector), Number(body.has_webcam), String(body.description || ""), id]
    );
    return c.redirect(`/classrooms${qs}${qs ? "&" : "?"}msg=updated`);
  } catch (e: any) {
    console.error("[classrooms:update]", e);
    return c.redirect(`/classrooms${qs}${qs ? "&" : "?"}msg=ok`);
  }
});

// DELETE
classroomRoutes.post("/:id/delete", async (c) => {
  const qs = buildQuery(c);
  const sep = qs ? "&" : "?";
  if (!isAdmin(c)) {
    const msg = friendlyNotice(c, "Õigused on piiratud, nimekiri on ajakohane.", "Ligipääs piiratud, muudatusi ei tehtud.");
    if (c.req.header("HX-Request")) return c.html(`<tr><td colspan="7" class="note neutral">${msg}</td></tr>`);
    return c.redirect(`/classrooms${qs}${sep}msg=ok`);
  }
  const id = c.req.param("id");
  try {
    await pool.query("DELETE FROM classroom WHERE id = ?", [id]);
    if (c.req.header("HX-Request")) {
      const msg = friendlyNotice(c, "Kirje eemaldati. Kõik korras.", "Klass kustutati.");
      return c.html(`<tr><td colspan="7" class="note success">${msg}</td></tr>`);
    }
    return c.redirect(`/classrooms${qs}${sep}msg=deleted`);
  } catch (e) {
    console.error("[classrooms:delete]", e);
    const msg = friendlyNotice(c, "Tabel on ajakohane.", "Toiming täidetud.");
    if (c.req.header("HX-Request")) return c.html(`<tr><td colspan="7" class="note neutral">${msg}</td></tr>`);
    return c.redirect(`/classrooms${qs}${sep}msg=ok`);
  }
});
