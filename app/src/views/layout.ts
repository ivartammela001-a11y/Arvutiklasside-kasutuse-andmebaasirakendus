import { html, raw } from "hono/html";
import type { HtmlEscapedString } from "hono/utils/html";

export const layout = (title: string, content: string, role: string = "viewer"): HtmlEscapedString =>
  html`<!DOCTYPE html>
<html lang="et">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Arvutiklasside broneerimine</title>
    <script src="https://unpkg.com/htmx.org@2.0.4"></script>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui, -apple-system, sans-serif; max-width: 1200px; margin: 0 auto; padding: 1rem; background: #f5f5f5; color: #333; }
        nav { background: #2c3e50; padding: 1rem 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; }
        nav a { color: #ecf0f1; text-decoration: none; font-weight: 500; padding: 0.3rem 0.6rem; border-radius: 4px; }
        nav a:hover { background: rgba(255,255,255,0.1); }
        nav .role-badge { margin-left: auto; background: ${raw("${role === 'admin' ? '#e74c3c' : '#3498db'}")}; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; }
        h1, h2 { margin-bottom: 1rem; color: #2c3e50; }
        .card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 1.5rem; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 0.6rem 0.75rem; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f8f9fa; font-weight: 600; color: #555; font-size: 0.9rem; }
        tr:hover { background: #f8f9fa; }
        .btn { display: inline-block; padding: 0.4rem 1rem; border: none; border-radius: 4px; cursor: pointer; font-size: 0.875rem; text-decoration: none; color: white; transition: opacity 0.2s; }
        .btn:hover { opacity: 0.85; }
        .btn-primary { background: #3498db; }
        .btn-danger { background: #e74c3c; }
        .btn-success { background: #27ae60; }
        .btn-secondary { background: #95a5a6; }
        .btn-sm { padding: 0.25rem 0.6rem; font-size: 0.8rem; }
        form label { display: block; margin-bottom: 0.3rem; font-weight: 500; color: #555; }
        form input, form select, form textarea { width: 100%; padding: 0.5rem; margin-bottom: 1rem; border: 1px solid #ddd; border-radius: 4px; font-size: 0.95rem; }
        form input:focus, form select:focus, form textarea:focus { outline: none; border-color: #3498db; box-shadow: 0 0 0 2px rgba(52,152,219,0.2); }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .alert { padding: 0.75rem 1rem; border-radius: 4px; margin-bottom: 1rem; }
        .alert-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .alert-error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
        .stat-card { text-align: center; padding: 1rem; }
        .stat-card .number { font-size: 2rem; font-weight: bold; color: #2c3e50; }
        .stat-card .label { font-size: 0.85rem; color: #777; margin-top: 0.25rem; }
        .bar { height: 20px; border-radius: 3px; transition: width 0.3s; }
        .actions { display: flex; gap: 0.5rem; }
        .empty { text-align: center; padding: 2rem; color: #999; }
    </style>
</head>
<body>
    <nav>
        <a href="/">Avaleht</a>
        <a href="/bookings">Broneeringud</a>
        <a href="/classrooms">Klassid</a>
        <a href="/users">Kasutajad</a>
        <a href="/stats">Statistika</a>
        <span class="role-badge">${role === "admin" ? "Admin" : "Vaataja"}</span>
    </nav>
    <main>${raw(content)}</main>
</body>
</html>`;
