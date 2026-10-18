import type { MutationCtx, QueryCtx } from "./_generated/server";

export async function passwordHash(username: string, password: string) {
  const data = new TextEncoder().encode(`${username.trim().toLowerCase()}:${password}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function accountFromToken(ctx: QueryCtx | MutationCtx, token: string | null | undefined) {
  if (!token) return null;
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();
  if (!session || session.expiresAt < Date.now()) return null;
  const account = await ctx.db.get(session.accountId);
  if (!account || account.status !== "aprobado") return null;
  return account;
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx, token: string) {
  const account = await accountFromToken(ctx, token);
  if (!account || account.role !== "admin") throw new Error("Hace falta entrar como administración.");
  return account;
}

export function orderNumber() {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const tail = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BOOM-${stamp}-${tail}`;
}
