import { Hono } from "hono";
import { initializeDatabase } from "./db";
import { authMiddleware } from "./middleware/auth";
import { bookingRoutes } from "./routes/bookings";
import { classroomRoutes } from "./routes/classrooms";
import { userRoutes } from "./routes/users";
import { statsRoutes } from "./routes/stats";
import { layout } from "./views/layout";

// Andmebaasi initsialiseerimine
await initializeDatabase();

const app = new Hono();

// Rollipõhine autentimine
app.use("*", authMiddleware);

// Avaleht
app.get("/", (c) => {
  const role = c.get("role");
  const rq = role ? `?role=${role}` : "";

  const content = `
    <div class="card">
      <h1>Arvutiklasside kasutuse andmebaasirakendus</h1>
      <p style="margin-bottom:1rem;color:#666">Tere tulemast! See rakendus võimaldab hallata arvutiklasside broneeringuid.</p>
      <div class="stats-grid">
        <a href="/bookings${rq}" class="card stat-card" style="text-decoration:none;color:inherit">
          <div class="number" style="color:#3498db">Broneeringud</div>
          <div class="label">Vaata ja halda broneeringuid</div>
        </a>
        <a href="/classrooms${rq}" class="card stat-card" style="text-decoration:none;color:inherit">
          <div class="number" style="color:#27ae60">Klassid</div>
          <div class="label">Arvutiklasside nimekiri</div>
        </a>
        <a href="/users${rq}" class="card stat-card" style="text-decoration:none;color:inherit">
          <div class="number" style="color:#e67e22">Kasutajad</div>
          <div class="label">Opetajad ja grupid</div>
        </a>
        <a href="/stats${rq}" class="card stat-card" style="text-decoration:none;color:inherit">
          <div class="number" style="color:#9b59b6">Statistika</div>
          <div class="label">Klasside kasutusstatistika</div>
        </a>
      </div>
    </div>
    <div class="card">
      <h2>Rollide vahetamine</h2>
      <p style="margin-bottom:0.5rem;color:#666">Praegune roll: <strong>${role}</strong></p>
      <div style="display:flex;gap:0.5rem">
        <a href="/?role=admin" class="btn btn-primary">Admin</a>
        <a href="/?role=viewer" class="btn btn-secondary">Vaataja</a>
      </div>
    </div>`;

  return c.html(layout("Avaleht", content, role));
});

// Marsruutide registreerimine
app.route("/bookings", bookingRoutes);
app.route("/classrooms", classroomRoutes);
app.route("/users", userRoutes);
app.route("/stats", statsRoutes);

const PORT = 3001;
console.log(`Server käivitatud: http://localhost:${PORT}`);

export default {
  port: PORT,
  fetch: app.fetch,
};
