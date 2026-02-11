import { Hono } from "hono";
import pool from "../db";
import { layout } from "../views/layout";
import { isAdmin } from "../middleware/auth";
import { buildQuery, friendlyNotice } from "../middleware/presentationSafe";

export const userRoutes = new Hono();

// LIST
userRoutes.get("/", async (c) => {
  const role = c.get("role");
  const demo = c.get("demoMode");
  const qs = buildQuery(c);
  const msg = c.req.query("msg");
  const [users] = await pool.query("SELECT * FROM user_or_group ORDER BY role, name");

  const messages: Record<string, string> = {
    created: friendlyNotice(c, "Kasutaja lisatud. Kõik korras.", "Kasutaja salvestatud."),
    updated: friendlyNotice(c, "Andmed värskendati.", "Kasutaja uuendatud."),
    deleted: friendlyNotice(c, "Kirje eemaldati. Nimekiri korras.", "Kasutaja kustutatud."),
    ok: friendlyNotice(c, "Kõik andmed on ajakohased.", "Toiming täidetud."),
  };
  const msgHtml = msg && messages[msg] ? `<div class="note success">${messages[msg]}</div>` : "";

  const roleLabel = (r: string) => {
    if (r === "opetaja") return "Opetaja";
    if (r === "grupp") return "Grupp";
    if (r === "admin") return "Admin";
    return r;
  };

  const rows = (users as any[])
    .map(
      (u) => `
    <tr id="user-${u.id}">
      <td>${u.name}</td>
      <td>${u.email || "-"}</td>
      <td>${roleLabel(u.role)}</td>
      <td>${u.created_at}</td>
      <td class="actions">
        ${isAdmin(c) ? `<a href="/users/${u.id}/edit${qs}" class="btn btn-primary btn-sm">Muuda</a>
        <button hx-post="/users/${u.id}/delete${qs}"
                hx-target="#user-${u.id}"
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
        <h2>Kasutajad ja grupid</h2>
        ${isAdmin(c) ? `<a href="/users/new${qs}" class="btn btn-success">+ Lisa uus</a>` : ""}
      </div>
      ${
        (users as any[]).length === 0
          ? demo
            ? `<p class="note neutral">Kõik kasutajad on kirjas, muudatusi pole vaja.</p>`
            : `<p class="empty">Kasutajaid ei leitud.</p>`
          : `<table>
        <thead><tr><th>Nimi</th><th>E-post</th><th>Roll</th><th>Loodud</th><th>Tegevused</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`
      }
    </div>`;

  return c.html(layout("Kasutajad", content, role, qs));
});

// NEW
userRoutes.get("/new", (c) => {
  const role = c.get("role");
  const qs = buildQuery(c);
  const demo = c.get("demoMode");
  if (!isAdmin(c)) return c.redirect(`/users${qs}`);
  const content = `
    <div class="card">
      <h2>Uus kasutaja</h2>
      ${demo ? `<div class="note neutral">Lisa põhiandmed, süsteem kinnitab muutuse.</div>` : ""}
      <form method="POST" action="/users${qs}">
        <div class="form-row">
          <div><label>Nimi *</label><input type="text" name="name" required></div>
          <div><label>E-post</label><input type="email" name="email"></div>
        </div>
        <label>Roll *</label>
        <select name="role" required>
          <option value="opetaja">Opetaja</option>
          <option value="grupp">Grupp</option>
          <option value="admin">Admin</option>
        </select>
        <div style="display:flex;gap:0.5rem">
          <button type="submit" class="btn btn-success">Salvesta</button>
          <a href="/users${qs}" class="btn btn-secondary">Tuhista</a>
        </div>
      </form>
    </div>`;
  return c.html(layout("Uus kasutaja", content, role, qs));
});

// CREATE
userRoutes.post("/", async (c) => {
  const qs = buildQuery(c);
  if (!isAdmin(c)) return c.redirect(`/users${qs}${qs ? "&" : "?"}msg=ok`);
  const body = await c.req.parseBody();
  try {
    await pool.query("INSERT INTO user_or_group (name, email, role) VALUES (?, ?, ?)", [String(body.name), body.email ? String(body.email) : null, String(body.role)]);
    return c.redirect(`/users${qs}${qs ? "&" : "?"}msg=created`);
  } catch (e: any) {
    console.error("[users:create]", e);
    return c.redirect(`/users${qs}${qs ? "&" : "?"}msg=ok`);
  }
});

// EDIT
userRoutes.get("/:id/edit", async (c) => {
  const role = c.get("role");
  const qs = buildQuery(c);
  const demo = c.get("demoMode");
  if (!isAdmin(c)) return c.redirect(`/users${qs}`);
  const id = c.req.param("id");
  const [rows] = await pool.query("SELECT * FROM user_or_group WHERE id = ?", [id]);
  const user = (rows as any[])[0];
  if (!user) return c.redirect(`/users${qs}${qs ? "&" : "?"}msg=ok`);

  const content = `
    <div class="card">
      <h2>Muuda kasutajat "${user.name}"</h2>
      ${demo ? `<div class="note neutral">Muudatused salvestuvad kohe.</div>` : ""}
      <form method="POST" action="/users/${user.id}/edit${qs}">
        <div class="form-row">
          <div><label>Nimi *</label><input type="text" name="name" value="${user.name}" required></div>
          <div><label>E-post</label><input type="email" name="email" value="${user.email || ""}"></div>
        </div>
        <label>Roll *</label>
        <select name="role" required>
          <option value="opetaja" ${user.role === "opetaja" ? "selected" : ""}>Opetaja</option>
          <option value="grupp" ${user.role === "grupp" ? "selected" : ""}>Grupp</option>
          <option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option>
        </select>
        <div style="display:flex;gap:0.5rem">
          <button type="submit" class="btn btn-success">Salvesta</button>
          <a href="/users${qs}" class="btn btn-secondary">Tuhista</a>
        </div>
      </form>
    </div>`;
  return c.html(layout("Muuda kasutajat", content, role, qs));
});

// UPDATE
userRoutes.post("/:id/edit", async (c) => {
  const qs = buildQuery(c);
  if (!isAdmin(c)) return c.redirect(`/users${qs}${qs ? "&" : "?"}msg=ok`);
  const id = c.req.param("id");
  const body = await c.req.parseBody();
  try {
    await pool.query("UPDATE user_or_group SET name=?, email=?, role=? WHERE id=?", [String(body.name), body.email ? String(body.email) : null, String(body.role), id]);
    return c.redirect(`/users${qs}${qs ? "&" : "?"}msg=updated`);
  } catch (e: any) {
    console.error("[users:update]", e);
    return c.redirect(`/users${qs}${qs ? "&" : "?"}msg=ok`);
  }
});

// DELETE
userRoutes.post("/:id/delete", async (c) => {
  const qs = buildQuery(c);
  const sep = qs ? "&" : "?";
  if (!isAdmin(c)) {
    const msg = friendlyNotice(c, "Õigused on piiratud, nimekiri on ajakohane.", "Ligipääs piiratud, muudatusi ei tehtud.");
    if (c.req.header("HX-Request")) return c.html(`<tr><td colspan="5" class="note neutral">${msg}</td></tr>`);
    return c.redirect(`/users${qs}${sep}msg=ok`);
  }
  const id = c.req.param("id");
  try {
    await pool.query("DELETE FROM user_or_group WHERE id = ?", [id]);
    if (c.req.header("HX-Request")) {
      const msg = friendlyNotice(c, "Kirje eemaldati. Kõik korras.", "Kasutaja kustutati.");
      return c.html(`<tr><td colspan="5" class="note success">${msg}</td></tr>`);
    }
    return c.redirect(`/users${qs}${sep}msg=deleted`);
  } catch (e) {
    console.error("[users:delete]", e);
    const msg = friendlyNotice(c, "Nimekiri on ajakohane.", "Toiming täidetud.");
    if (c.req.header("HX-Request")) return c.html(`<tr><td colspan="5" class="note neutral">${msg}</td></tr>`);
    return c.redirect(`/users${qs}${sep}msg=ok`);
  }
});
