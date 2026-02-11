import { createMiddleware } from "hono/factory";

export const authMiddleware = createMiddleware(async (c, next) => {
  const role = c.req.query("role") || c.req.header("X-Role") || "admin";

  if (role !== "admin" && role !== "viewer") {
    c.set("role", "viewer");
  } else {
    c.set("role", role);
  }

  await next();
});

export function isAdmin(c: any): boolean {
  return c.get("role") === "admin";
}

export function roleQuery(c: any): string {
  const role = c.get("role");
  return role ? `role=${role}` : "";
}
