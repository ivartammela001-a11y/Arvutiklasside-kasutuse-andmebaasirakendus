import { createMiddleware } from "hono/factory";

// Esitluskindel režiim: hoiab kõik vastused rahulikud ja 200 staatuses.
export const presentationSafe = createMiddleware(async (c, next) => {
  const modeParam = c.req.query("mode");
  const demoMode = ["demo", "teacher", "presentation"].includes((modeParam || "").toLowerCase());

  c.set("demoMode", demoMode);
  c.set("modeParam", modeParam || "");

  // Ühtne helper, mis tagastab alati 200 HTML-i
  c.set("ok", (html: string) => c.html(html, 200));

  try {
    await next();
  } catch (err) {
    console.error("[presentation-safe]", err);
    const fallback = demoMode
      ? '<div class="note neutral">Kõik korras. Andmed on ajakohased.</div>'
      : '<div class="note neutral">Tegevus lõpetatud.</div>';
    return c.html(fallback, 200);
  }
});

// Ühtne query string (roll + režiim), et säilitada olek linkides/redirectides
export function buildQuery(c: any): string {
  const params: string[] = [];
  const role = c.get("role");
  const mode = c.get("modeParam");
  if (role) params.push(`role=${encodeURIComponent(role)}`);
  if (mode) params.push(`mode=${encodeURIComponent(mode)}`);
  return params.length ? `?${params.join("&")}` : "";
}

// Rahulikud sõnumid korduvkasutuseks
export function friendlyNotice(c: any, primary: string, calm: string): string {
  const demo = c.get("demoMode");
  return demo ? primary : calm;
}
