import { Hono } from "hono";
import db from "../db";
import { layout } from "../views/layout";
import { isAdmin } from "../middleware/auth";

export const userRoutes = new Hono();

function rq(c: any): string {
  return c.get("role") ? `?role=${c.get("role")}` : "";
}

// LIST
userRoutes.get("/", (c) => {
  const role = c.get("role");
  const msg = c.req.query("msg");
  const users = db.query("SELECT * FROM user_or_group ORDER BY role, name").all() as any[];

  let msgHtml = "";
  if (msg === "created") msgHtml = `<div class="alert alert-success">Kasutaja edukalt lisatud!</div>`;
  if (msg === "updated") msgHtml = `<div class="alert alert-success">Kasutaja edukalt muudetud!</div>`;
  if (msg === "deleted") msgHtml = `<div class="alert alert-success">Kasutaja kustutatud!</div>`;

  const roleLabel = (r: string) => {
    if (r === "opetaja") return "Opetaja";
    if (r === "grupp") return "Grupp";
    if (r === "admin") return "Admin";
    return r;
  };

  const rows = users
    .map(
      (u: any) => `
    <tr id="user-${u.id}">
      <td>${u.name}</td>
      <td>${u.email || "-"}</td>
      <td>${roleLabel(u.role)}</td>
      <td>${u.created_at}</td>
      <td class="actions">
        ${isAdmin(c) ? `<a href="/users/${u.id}/edit${rq(c)}" class="btn btn-primary btn-sm">Muuda</a>
        <button hx-post="/users/${u.id}/delete${rq(c)}"
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
        ${isAdmin(c) ? `<a href="/users/new${rq(c)}" class="btn btn-success">+ Lisa uus</a>` : ""}
      </div>
      ${
        users.length === 0
          ? `<p class="empty">Kasutajaid ei leitud.</p>`
          : `<table>
        <thead><tr><th>Nimi</th><th>E-post</th><th>Roll</th><th>Loodud</th><th>Tegevused</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`
      }
    </div>`;

  return c.html(layout("Kasutajad", content, role));
});

// NEW
userRoutes.get("/new", (c) => {
  const role = c.get("role");
  if (!isAdmin(c)) return c.redirect(`/users${rq(c)}`);

  const content = `
    <div class="card">
      <h2>Uus kasutaja</h2>
      <form method="POST" action="/users${rq(c)}">
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
          <a href="/users${rq(c)}" class="btn btn-secondary">Tuhista</a>
        </div>
      </form>
    </div>`;

  return c.html(layout("Uus kasutaja", content, role));
});

// CREATE
userRoutes.post("/", async (c) => {
  if (!isAdmin(c)) return c.redirect(`/users${rq(c)}`);
  const body = await c.req.parseBody();

  try {
    db.query(
      "INSERT INTO user_or_group (name, email, role) VALUES (?, ?, ?)"
    ).run(String(body.name), body.email ? String(body.email) : null, String(body.role));
    return c.redirect(`/users${rq(c)}&msg=created`);
  } catch (e: any) {
    return c.redirect(`/users/new${rq(c)}&error=${encodeURIComponent(e.message)}`);
  }
});

// EDIT
userRoutes.get("/:id/edit", (c) => {
  const role = c.get("role");
  if (!isAdmin(c)) return c.redirect(`/users${rq(c)}`);

  const id = c.req.param("id");
  const user = db.query("SELECT * FROM user_or_group WHERE id = ?").get(id) as any;
  if (!user) return c.redirect(`/users${rq(c)}`);

  const content = `
    <div class="card">
      <h2>Muuda kasutajat "${user.name}"</h2>
      <form method="POST" action="/users/${user.id}/edit${rq(c)}">
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
          <a href="/users${rq(c)}" class="btn btn-secondary">Tuhista</a>
        </div>
      </form>
    </div>`;

  return c.html(layout("Muuda kasutajat", content, role));
});

// UPDATE
userRoutes.post("/:id/edit", async (c) => {
  if (!isAdmin(c)) return c.redirect(`/users${rq(c)}`);
  const id = c.req.param("id");
  const body = await c.req.parseBody();

  try {
    db.query(
      "UPDATE user_or_group SET name = ?, email = ?, role = ? WHERE id = ?"
    ).run(String(body.name), body.email ? String(body.email) : null, String(body.role), id);
    return c.redirect(`/users${rq(c)}&msg=updated`);
  } catch (e: any) {
    return c.redirect(`/users/${id}/edit${rq(c)}&error=${encodeURIComponent(e.message)}`);
  }
});

// DELETE
userRoutes.post("/:id/delete", (c) => {
  if (!isAdmin(c)) return c.text("Keelatud", 403);
  const id = c.req.param("id");
  db.query("DELETE FROM user_or_group WHERE id = ?").run(id);
  if (c.req.header("HX-Request")) return c.html("");
  return c.redirect(`/users${rq(c)}&msg=deleted`);
});
