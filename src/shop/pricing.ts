import { pesos } from "./format";
import type { PriceList, Promo, PromoKind } from "./types";

export interface PriceQuote {
  listPrice: number;
  qty: number;
  lineTotal: number;
  promo: Promo | null;
  announced: Promo | null;
}

export function emptyPromo(): Promo {
  return {
    id: "",
    name: "",
    detail: "",
    badge: "",
    active: true,
    lists: ["minorista"],
    kind: "percent",
    percent: 10,
    amount: 1000,
    offerPrice: 0,
    buyQty: 2,
    payQty: 1,
    productCodes: [],
    allProducts: false,
    minQty: 1,
    startsAt: "",
    endsAt: "",
  };
}

export function todayKey(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Salta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function defaultBadge(promo: Pick<Promo, "badge" | "kind" | "percent" | "amount" | "buyQty" | "payQty">) {
  if (promo.badge.trim()) return promo.badge.trim();
  if (promo.kind === "percent") return `−${promo.percent}%`;
  if (promo.kind === "amount") return `−${pesos(promo.amount)}`;
  if (promo.kind === "price") return "Oferta";
  return `${promo.buyQty}x${promo.payQty}`;
}

export function promoHint(promo: Promo) {
  if (promo.kind === "percent") return `${promo.percent}% de descuento`;
  if (promo.kind === "amount") return `${pesos(promo.amount)} menos por unidad`;
  if (promo.kind === "price") return `Precio de oferta ${pesos(promo.offerPrice)}`;
  return `Llevá ${promo.buyQty}, pagá ${promo.payQty}`;
}

export function promoIsLive(promo: Promo, list: PriceList, now = new Date()) {
  if (!promo.active) return false;
  if (!promo.lists.includes(list)) return false;
  const day = todayKey(now);
  if (promo.startsAt && day < promo.startsAt) return false;
  if (promo.endsAt && day > promo.endsAt) return false;
  return true;
}

export function promoMatches(promo: Promo, code: string) {
  if (promo.allProducts) return true;
  return promo.productCodes.some((item) => item.toLowerCase() === code.toLowerCase());
}

export function validatePromo(promo: Promo) {
  if (!promo.name.trim()) return "La promo necesita un nombre.";
  if (promo.lists.length === 0) return "Elegí al menos una lista de precio.";
  if (!promo.allProducts && promo.productCodes.length === 0) {
    return "Elegí productos o marcala para todo el catálogo.";
  }
  if (promo.kind === "percent" && (promo.percent <= 0 || promo.percent > 100)) {
    return "El porcentaje tiene que estar entre 1 y 100.";
  }
  if (promo.kind === "amount" && promo.amount <= 0) return "El descuento en pesos tiene que ser mayor a cero.";
  if (promo.kind === "price" && promo.offerPrice < 0) return "El precio de oferta no puede ser negativo.";
  if (promo.kind === "nxm" && (promo.buyQty < 2 || promo.payQty < 1 || promo.payQty >= promo.buyQty)) {
    return "En llevá N pagá M, la cantidad que se lleva tiene que ser mayor que la que se paga.";
  }
  if (promo.minQty < 1) return "El mínimo de unidades es 1.";
  if (promo.startsAt && promo.endsAt && promo.endsAt < promo.startsAt) {
    return "La fecha de fin es anterior al inicio.";
  }
  return null;
}

export function normalizePromo(promo: Promo): Promo {
  return {
    ...promo,
    name: promo.name.trim(),
    detail: promo.detail.trim(),
    badge: promo.badge.trim(),
    percent: Math.round(Number(promo.percent) || 0),
    amount: Math.round(Number(promo.amount) || 0),
    offerPrice: Math.round(Number(promo.offerPrice) || 0),
    buyQty: Math.round(Number(promo.buyQty) || 0),
    payQty: Math.round(Number(promo.payQty) || 0),
    minQty: Math.max(1, Math.round(Number(promo.minQty) || 1)),
    productCodes: [...new Set(promo.productCodes.map((code) => code.trim().toUpperCase()).filter(Boolean))],
    startsAt: promo.startsAt.trim(),
    endsAt: promo.endsAt.trim(),
  };
}

function applyPromo(promo: Promo, listPrice: number, qty: number) {
  const min = Math.max(1, promo.minQty || 1);
  if (promo.kind === "percent") {
    if (qty < min) return null;
    const percent = Math.min(100, Math.max(0, promo.percent));
    return Math.round((listPrice * (100 - percent)) / 100) * qty;
  }
  if (promo.kind === "amount") {
    if (qty < min) return null;
    return Math.max(0, listPrice - Math.round(promo.amount)) * qty;
  }
  if (promo.kind === "price") {
    if (qty < min) return null;
    return Math.max(0, Math.round(promo.offerPrice)) * qty;
  }
  const buy = Math.max(2, Math.round(promo.buyQty));
  const pay = Math.min(buy - 1, Math.max(1, Math.round(promo.payQty)));
  if (qty < Math.max(min, buy)) return null;
  const groups = Math.floor(qty / buy);
  const rest = qty % buy;
  return listPrice * (groups * pay + rest);
}

function qualifyingQty(promo: Promo) {
  if (promo.kind === "nxm") return Math.max(promo.minQty || 1, promo.buyQty || 2);
  return Math.max(1, promo.minQty || 1);
}

export function quoteLine(input: {
  listPrice: number;
  qty: number;
  code: string;
  promos: Promo[];
  list: PriceList;
  now?: Date;
}): PriceQuote {
  const qty = Math.max(0, input.qty);
  const full = input.listPrice * qty;
  const live = input.promos.filter(
    (promo) => promoIsLive(promo, input.list, input.now) && promoMatches(promo, input.code),
  );

  let applied: { lineTotal: number; promo: Promo } | null = null;
  let announced: { unit: number; promo: Promo } | null = null;

  for (const promo of live) {
    const nowTotal = qty > 0 ? applyPromo(promo, input.listPrice, qty) : null;
    if (nowTotal != null && nowTotal < full && (!applied || nowTotal < applied.lineTotal)) {
      applied = { lineTotal: nowTotal, promo };
    }
    const sampleQty = qualifyingQty(promo);
    const sample = applyPromo(promo, input.listPrice, sampleQty);
    if (sample == null || sample >= input.listPrice * sampleQty) continue;
    const unit = sample / sampleQty;
    if (!announced || unit < announced.unit) announced = { unit, promo };
  }

  return {
    listPrice: input.listPrice,
    qty,
    lineTotal: applied?.lineTotal ?? full,
    promo: applied?.promo ?? null,
    announced: announced?.promo ?? null,
  };
}

export function lineCharge(line: { unitPrice: number; qty: number; lineTotal?: number }) {
  return line.lineTotal ?? line.unitPrice * line.qty;
}

export function formatCartLine(
  product: { code: string; name: string; availability: string },
  qty: number,
  quote: PriceQuote,
) {
  const flag = product.availability === "consultar" ? " (a consultar)" : "";
  const promo = quote.promo ? ` · ${defaultBadge(quote.promo)}` : "";
  const list =
    quote.promo && quote.lineTotal !== quote.listPrice * qty ? ` (lista ${pesos(quote.listPrice * qty)})` : "";
  return `• ${product.code} ${product.name} x ${qty} — ${pesos(quote.lineTotal)}${list}${promo}${flag}`;
}

export const PROMO_KIND_LABEL: Record<PromoKind, string> = {
  percent: "Porcentaje",
  amount: "Monto fijo",
  price: "Precio de oferta",
  nxm: "Llevá N, pagá M",
};
