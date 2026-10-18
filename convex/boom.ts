import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { accountFromToken, orderNumber, passwordHash, requireAdmin } from "./lib";
import { STARTER_PRODUCTS, STARTER_SETTINGS } from "../src/shop/seed";

const payment = v.union(v.literal("contado"), v.literal("cuenta_corriente"));

async function publicProduct(
  ctx: { storage: { getUrl: (id: never) => Promise<string | null> } },
  product: {
    code: string;
    name: string;
    category: string;
    brand: string;
    summary: string;
    detail: string;
    unit: string;
    retailPrice: number;
    wholesalePrice: number;
    minWholesale: number;
    availability: "disponible" | "consultar" | "agotado";
    featured: boolean;
    pin: number | null;
    active: boolean;
    image: string;
    imageId?: never;
  },
  showWholesale: boolean,
) {
  let image = product.image;
  if (product.imageId) {
    image = (await ctx.storage.getUrl(product.imageId)) ?? product.image;
  }
  return {
    code: product.code,
    name: product.name,
    category: product.category,
    brand: product.brand,
    summary: product.summary,
    detail: product.detail,
    unit: product.unit,
    retailPrice: product.retailPrice,
    wholesalePrice: showWholesale ? product.wholesalePrice : null,
    minWholesale: product.minWholesale,
    availability: product.availability,
    featured: product.featured,
    pin: product.pin,
    active: product.active,
    image,
  };
}

export const bootstrap = mutation({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("settings").first();
    if (settings) return "lista";
    await ctx.db.insert("settings", STARTER_SETTINGS);
    for (const product of STARTER_PRODUCTS) {
      await ctx.db.insert("products", {
        ...product,
        wholesalePrice: product.wholesalePrice ?? 0,
      });
    }
    await ctx.db.insert("accounts", {
      username: "admin",
      passwordHash: await passwordHash("admin", "boom2026"),
      role: "admin",
      name: "Administración",
      business: "Pirotecnia Boom",
      phone: "",
      zone: "Salta Capital",
      paymentMode: "contado",
      status: "aprobado",
    });
    await ctx.db.insert("accounts", {
      username: "revendedor",
      passwordHash: await passwordHash("revendedor", "salta2026"),
      role: "mayorista",
      name: "Puesto demo",
      business: "Revendedor demo",
      phone: "",
      zone: "Salta Capital",
      paymentMode: "cuenta_corriente",
      status: "aprobado",
    });
    return "creada";
  },
});

export const listProducts = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const account = await accountFromToken(ctx, args.token ?? null);
    const showWholesale = account?.role === "admin" || account?.role === "mayorista";
    const rows = await ctx.db.query("products").collect();
    const visible = rows.filter((product) => product.active || account?.role === "admin");
    return Promise.all(visible.map((product) => publicProduct(ctx, product, showWholesale)));
  },
});

export const getSettings = query({
  args: {},
  handler: async (ctx) => ctx.db.query("settings").first(),
});

export const currentSession = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const account = await accountFromToken(ctx, args.token);
    if (!account) return null;
    return {
      token: args.token,
      role: account.role,
      name: account.name,
      business: account.business,
      zone: account.zone,
      paymentMode: account.paymentMode,
    };
  },
});

export const listOrders = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const orders = await ctx.db.query("orders").collect();
    return orders
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((order) => ({ ...order, id: order._id }));
  },
});

export const listAccounts = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const accounts = await ctx.db.query("accounts").collect();
    return accounts
      .filter((account) => account.role === "mayorista")
      .map((account) => ({
        id: account._id,
        username: account.username,
        passwordHash: "",
        role: account.role,
        name: account.name,
        business: account.business,
        phone: account.phone,
        zone: account.zone,
        paymentMode: account.paymentMode,
        status: account.status,
      }));
  },
});

export const login = mutation({
  args: { username: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const username = args.username.trim().toLowerCase();
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();
    if (!account || account.passwordHash !== (await passwordHash(username, args.password))) {
      return { error: "Usuario o clave incorrectos." };
    }
    if (account.status !== "aprobado") return { error: "Ese acceso todavía no está aprobado." };
    const token = crypto.randomUUID();
    await ctx.db.insert("sessions", {
      token,
      accountId: account._id,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 14,
    });
    return {
      error: null,
      session: {
        token,
        role: account.role,
        name: account.name,
        business: account.business,
        zone: account.zone,
        paymentMode: account.paymentMode,
      },
    };
  },
});

export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (session) await ctx.db.delete(session._id);
  },
});

export const requestAccess = mutation({
  args: {
    username: v.string(),
    password: v.string(),
    name: v.string(),
    business: v.string(),
    phone: v.string(),
    zone: v.string(),
    paymentMode: payment,
  },
  handler: async (ctx, args) => {
    const username = args.username.trim().toLowerCase();
    if (args.password.length < 6) return "La clave necesita al menos 6 caracteres.";
    if (!args.name.trim() || !args.business.trim() || !args.phone.trim()) {
      return "Completá nombre, negocio y teléfono.";
    }
    const existing = await ctx.db
      .query("accounts")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();
    if (existing) return "Ese usuario ya existe.";
    await ctx.db.insert("accounts", {
      username,
      passwordHash: await passwordHash(username, args.password),
      role: "mayorista",
      name: args.name.trim(),
      business: args.business.trim(),
      phone: args.phone.trim(),
      zone: args.zone,
      paymentMode: args.paymentMode,
      status: "pendiente",
    });
    return null;
  },
});

export const placeOrder = mutation({
  args: {
    token: v.optional(v.string()),
    customerName: v.string(),
    phone: v.string(),
    zone: v.string(),
    paymentMode: payment,
    note: v.string(),
    lines: v.array(v.object({ code: v.string(), qty: v.number() })),
  },
  handler: async (ctx, args) => {
    if (!args.customerName.trim() || !args.phone.trim()) {
      return { error: "Faltan el nombre y el teléfono.", text: "", number: "" };
    }
    if (args.lines.length === 0) return { error: "La comanda está vacía.", text: "", number: "" };
    const account = await accountFromToken(ctx, args.token ?? null);
    const priceList = account?.role === "mayorista" ? "mayorista" : "minorista";
    if (
      priceList === "mayorista" &&
      args.paymentMode === "cuenta_corriente" &&
      account?.paymentMode !== "cuenta_corriente"
    ) {
      return { error: "La cuenta corriente no está habilitada para este acceso.", text: "", number: "" };
    }
    const lines = [];
    for (const line of args.lines) {
      const product = await ctx.db
        .query("products")
        .withIndex("by_code", (q) => q.eq("code", line.code))
        .unique();
      if (!product || !product.active) {
        return { error: `El código ${line.code} ya no está en la lista.`, text: "", number: "" };
      }
      if (product.availability === "agotado") {
        return { error: `${product.code} está agotado.`, text: "", number: "" };
      }
      const minimum = priceList === "mayorista" ? product.minWholesale : 1;
      if (line.qty < minimum) {
        return { error: `${product.code} pide un mínimo de ${minimum} en esta lista.`, text: "", number: "" };
      }
      lines.push({
        code: product.code,
        name: product.name,
        qty: line.qty,
        unitPrice: priceList === "mayorista" ? product.wholesalePrice : product.retailPrice,
        availability: product.availability,
      });
    }
    const total = lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
    const number = orderNumber();
    await ctx.db.insert("orders", {
      number,
      createdAt: Date.now(),
      priceList,
      customerName: args.customerName.trim(),
      phone: args.phone.trim(),
      zone: args.zone,
      paymentMode: args.paymentMode,
      note: args.note.trim(),
      lines,
      total,
      status: "nuevo",
    });
    const text = [
      `Pedido ${number}`,
      "Pirotecnia Boom",
      priceList === "mayorista" ? "Lista: Revendedor" : "Lista: Mostrador",
      `Nombre: ${args.customerName.trim()}`,
      `Teléfono: ${args.phone.trim()}`,
      `Zona: ${args.zone}`,
      `Pago: ${args.paymentMode === "contado" ? "Contado" : "Cuenta corriente"}`,
      ...lines.map((line) => {
        const flag = line.availability === "consultar" ? " (a consultar)" : "";
        return `${line.code} ${line.name} x ${line.qty} — $${line.unitPrice * line.qty}${flag}`;
      }),
      `Total: $${total}`,
      args.note.trim() ? `Nota: ${args.note.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    return { error: null, text, number };
  },
});

export const saveProduct = mutation({
  args: {
    token: v.string(),
    code: v.string(),
    name: v.string(),
    category: v.string(),
    brand: v.string(),
    summary: v.string(),
    detail: v.string(),
    unit: v.string(),
    retailPrice: v.number(),
    wholesalePrice: v.number(),
    minWholesale: v.number(),
    availability: v.union(v.literal("disponible"), v.literal("consultar"), v.literal("agotado")),
    featured: v.boolean(),
    pin: v.union(v.number(), v.null()),
    active: v.boolean(),
    image: v.string(),
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const code = args.code.trim().toUpperCase();
    if (!code || !args.name.trim()) return "El código y el nombre son obligatorios.";
    const existing = await ctx.db
      .query("products")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();
    const { token: _token, ...fields } = args;
    const doc = { ...fields, code, name: args.name.trim() };
    if (existing) await ctx.db.replace(existing._id, doc);
    else await ctx.db.insert("products", doc);
    return null;
  },
});

export const removeProduct = mutation({
  args: { token: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const existing = await ctx.db
      .query("products")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});

export const setAccountStatus = mutation({
  args: {
    token: v.string(),
    id: v.id("accounts"),
    status: v.union(v.literal("pendiente"), v.literal("aprobado"), v.literal("rechazado")),
    paymentMode: payment,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    await ctx.db.patch(args.id, { status: args.status, paymentMode: args.paymentMode });
  },
});

export const saveSettings = mutation({
  args: {
    token: v.string(),
    whatsapp: v.string(),
    city: v.string(),
    notice: v.string(),
    pricesConfirmed: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const current = await ctx.db.query("settings").first();
    const { token: _token, ...fields } = args;
    if (current) await ctx.db.patch(current._id, fields);
    else await ctx.db.insert("settings", fields);
  },
});

export const setOrderStatus = mutation({
  args: {
    token: v.string(),
    id: v.id("orders"),
    status: v.union(v.literal("nuevo"), v.literal("en_curso"), v.literal("cerrado")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const changePassword = mutation({
  args: { token: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const account = await accountFromToken(ctx, args.token);
    if (!account) return "No hay una sesión abierta.";
    if (args.password.length < 6) return "La clave necesita al menos 6 caracteres.";
    await ctx.db.patch(account._id, {
      passwordHash: await passwordHash(account.username, args.password),
    });
    return null;
  },
});

export const generateUploadUrl = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    return ctx.storage.generateUploadUrl();
  },
});
