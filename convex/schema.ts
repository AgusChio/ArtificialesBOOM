import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const availability = v.union(
  v.literal("disponible"),
  v.literal("consultar"),
  v.literal("agotado"),
);

const payment = v.union(v.literal("contado"), v.literal("cuenta_corriente"));

export default defineSchema({
  products: defineTable({
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
    availability,
    featured: v.boolean(),
    pin: v.union(v.number(), v.null()),
    active: v.boolean(),
    image: v.string(),
    imageId: v.optional(v.id("_storage")),
  }).index("by_code", ["code"]),

  accounts: defineTable({
    username: v.string(),
    passwordHash: v.string(),
    role: v.union(v.literal("admin"), v.literal("mayorista")),
    name: v.string(),
    business: v.string(),
    phone: v.string(),
    zone: v.string(),
    paymentMode: payment,
    status: v.union(v.literal("pendiente"), v.literal("aprobado"), v.literal("rechazado")),
  }).index("by_username", ["username"]),

  sessions: defineTable({
    token: v.string(),
    accountId: v.id("accounts"),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),

  orders: defineTable({
    number: v.string(),
    createdAt: v.number(),
    priceList: v.union(v.literal("minorista"), v.literal("mayorista")),
    customerName: v.string(),
    phone: v.string(),
    zone: v.string(),
    paymentMode: payment,
    note: v.string(),
    lines: v.array(
      v.object({
        code: v.string(),
        name: v.string(),
        qty: v.number(),
        unitPrice: v.number(),
        lineTotal: v.optional(v.number()),
        promoName: v.optional(v.string()),
        availability: v.string(),
      }),
    ),
    total: v.number(),
    status: v.union(v.literal("nuevo"), v.literal("en_curso"), v.literal("cerrado")),
  }),

  settings: defineTable({
    whatsapp: v.string(),
    city: v.string(),
    notice: v.string(),
    pricesConfirmed: v.boolean(),
  }),

  promos: defineTable({
    name: v.string(),
    detail: v.string(),
    badge: v.string(),
    active: v.boolean(),
    lists: v.array(v.union(v.literal("minorista"), v.literal("mayorista"))),
    kind: v.union(v.literal("percent"), v.literal("amount"), v.literal("price"), v.literal("nxm")),
    percent: v.number(),
    amount: v.number(),
    offerPrice: v.number(),
    buyQty: v.number(),
    payQty: v.number(),
    productCodes: v.array(v.string()),
    allProducts: v.boolean(),
    minQty: v.number(),
    startsAt: v.string(),
    endsAt: v.string(),
  }),
});
