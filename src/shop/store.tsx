import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { passwordHash, orderNumber, pesos, whatsappLink } from "./format";
import { lineCharge, normalizePromo, quoteLine, validatePromo, type PriceQuote } from "./pricing";
import { STARTER_PRODUCTS, STARTER_SETTINGS } from "./seed";
import type {
  AccessRequest,
  Account,
  CartLine,
  CheckoutInput,
  Order,
  OrderLine,
  PaymentMode,
  PriceList,
  Product,
  Promo,
  Session,
  Settings,
} from "./types";

const DB_KEY = "boom-db-v2";
const CART_KEY = "boom-cart-v1";
const TOKEN_KEY = "boom-token-v1";

interface Database {
  products: Product[];
  accounts: Account[];
  orders: Order[];
  settings: Settings;
  promos: Promo[];
  sessions: { token: string; accountId: string }[];
}

function hydrate(raw: Partial<Database> & Pick<Database, "products" | "accounts" | "orders" | "settings" | "sessions">): Database {
  return { ...raw, promos: raw.promos ?? [] };
}

export interface ShopValue {
  ready: boolean;
  mode: "local" | "convex";
  products: Product[];
  promos: Promo[];
  settings: Settings;
  session: Session | null;
  orders: Order[];
  accounts: Account[];
  cart: CartLine[];
  priceList: PriceList;
  setPriceList: (list: PriceList) => void;
  comandaOpen: boolean;
  setComandaOpen: (open: boolean) => void;
  add: (code: string, qty?: number) => string | null;
  setQty: (code: string, qty: number) => void;
  remove: (code: string) => void;
  clearCart: () => void;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
  requestAccess: (input: AccessRequest) => Promise<string | null>;
  placeOrder: (
    input: CheckoutInput,
  ) => Promise<{ error: string | null; text: string; url: string | null; number: string }>;
  saveProduct: (product: Product) => Promise<string | null>;
  removeProduct: (code: string) => Promise<void>;
  savePromo: (promo: Promo) => Promise<string | null>;
  removePromo: (id: string) => Promise<void>;
  quote: (product: Product, qty?: number) => PriceQuote;
  setAccountStatus: (
    id: string,
    status: Account["status"],
    paymentMode: PaymentMode,
  ) => Promise<void>;
  saveSettings: (settings: Settings) => Promise<void>;
  setOrderStatus: (id: string, status: Order["status"]) => Promise<void>;
  changePassword: (password: string) => Promise<string | null>;
  unitPrice: (product: Product) => number;
  lineTotal: (code: string) => number;
  cartCount: number;
  cartTotal: number;
  receipt: { text: string; url: string | null; number: string } | null;
  clearReceipt: () => void;
}

const ShopContext = createContext<ShopValue | null>(null);

export function whatsappCheckout(session: Session | null): CheckoutInput {
  return {
    customerName: session?.business || session?.name || "Cliente WhatsApp",
    phone: "Sin teléfono",
    zone: session?.zone || "Salta Capital",
    paymentMode: session?.paymentMode === "cuenta_corriente" ? "cuenta_corriente" : "contado",
    note: "Pedido enviado por WhatsApp",
  };
}

export function useShop() {
  const value = useContext(ShopContext);
  if (!value) throw new Error("La tienda no está lista.");
  return value;
}

export function ShopContextProvider({
  value,
  children,
}: {
  value: ShopValue;
  children: ReactNode;
}) {
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

function canSeeWholesale(session: Session | null) {
  return session?.role === "admin" || session?.role === "mayorista";
}

function present(product: Product, session: Session | null): Product {
  if (canSeeWholesale(session)) return product;
  return { ...product, wholesalePrice: null };
}

function priceOf(product: Product, list: PriceList) {
  if (list === "mayorista") return product.wholesalePrice ?? product.retailPrice;
  return product.retailPrice;
}

function readCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

function orderText(order: Order) {
  const lines = order.lines.map((line) => {
    const flag = line.availability === "consultar" ? " (a consultar)" : "";
    const charge = lineCharge(line);
    const promo = line.promoName ? ` · ${line.promoName}` : "";
    const list = line.promoName && charge !== line.unitPrice * line.qty ? ` (lista ${pesos(line.unitPrice * line.qty)})` : "";
    return `${line.code} ${line.name} x ${line.qty} — ${pesos(charge)}${list}${promo}${flag}`;
  });
  return [
    `Pedido ${order.number}`,
    "Pirotecnia Boom",
    order.priceList === "mayorista" ? "Lista: Revendedor" : "Lista: Mostrador",
    `Nombre: ${order.customerName}`,
    `Teléfono: ${order.phone}`,
    `Zona: ${order.zone}`,
    `Pago: ${order.paymentMode === "contado" ? "Contado" : "Cuenta corriente"}`,
    "",
    ...lines,
    "",
    `Total: ${pesos(order.total)}`,
    order.note ? `Nota: ${order.note}` : "",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function LocalShop({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [viewAs, setViewAs] = useState<PriceList>("minorista");
  const [comandaOpen, setComandaOpen] = useState(false);
  const [receipt, setReceipt] = useState<ShopValue["receipt"]>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const saved = localStorage.getItem(DB_KEY);
      if (saved) {
        if (!cancel) {
          setDb(hydrate(JSON.parse(saved) as Database));
          setCart(readCart());
          setToken(localStorage.getItem(TOKEN_KEY));
        }
        return;
      }
      const adminHash = await passwordHash("admin", "boom2026");
      const dealerHash = await passwordHash("revendedor", "salta2026");
      const fresh: Database = {
        products: STARTER_PRODUCTS,
        settings: STARTER_SETTINGS,
        orders: [],
        promos: [],
        sessions: [],
        accounts: [
          {
            id: "admin",
            username: "admin",
            passwordHash: adminHash,
            role: "admin",
            name: "Administración",
            business: "Pirotecnia Boom",
            phone: "",
            zone: "Salta Capital",
            paymentMode: "contado",
            status: "aprobado",
          },
          {
            id: "revendedor",
            username: "revendedor",
            passwordHash: dealerHash,
            role: "mayorista",
            name: "Puesto demo",
            business: "Revendedor demo",
            phone: "",
            zone: "Salta Capital",
            paymentMode: "cuenta_corriente",
            status: "aprobado",
          },
        ],
      };
      localStorage.setItem(DB_KEY, JSON.stringify(fresh));
      if (!cancel) {
        setDb(fresh);
        setCart(readCart());
        setToken(localStorage.getItem(TOKEN_KEY));
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const commit = useCallback((next: Database) => {
    setDb(next);
    localStorage.setItem(DB_KEY, JSON.stringify(next));
  }, []);

  useEffect(() => {
    if (db) localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, db]);

  const session = useMemo<Session | null>(() => {
    if (!db || !token) return null;
    const link = db.sessions.find((item) => item.token === token);
    const account = db.accounts.find((item) => item.id === link?.accountId);
    if (!account || account.status !== "aprobado") return null;
    return {
      token,
      role: account.role,
      name: account.name,
      business: account.business,
      zone: account.zone,
      paymentMode: account.paymentMode,
    };
  }, [db, token]);

  const priceList: PriceList =
    session?.role === "mayorista" ? "mayorista" : session?.role === "admin" ? viewAs : "minorista";

  const products = useMemo(() => {
    if (!db) return [];
    return db.products
      .filter((product) => product.active || session?.role === "admin")
      .map((product) => present(product, session));
  }, [db, session]);

  const lookup = useCallback(
    (code: string) => db?.products.find((product) => product.code.toLowerCase() === code.toLowerCase()),
    [db],
  );

  const add = useCallback(
    (code: string, qty = 1) => {
      const product = lookup(code);
      if (!product || !product.active) return "Ese código no está en la lista.";
      if (product.availability === "agotado") return "Ese código está agotado.";
      const minimum = priceList === "mayorista" ? product.minWholesale : 1;
      setCart((current) => {
        const found = current.find((line) => line.code === product.code);
        if (!found) return [...current, { code: product.code, qty: Math.max(qty, minimum) }];
        return current.map((line) =>
          line.code === product.code ? { ...line, qty: line.qty + qty } : line,
        );
      });
      setReceipt(null);
      setComandaOpen(true);
      return null;
    },
    [lookup, priceList],
  );

  const setQty = useCallback((code: string, qty: number) => {
    setCart((current) =>
      qty <= 0 ? current.filter((line) => line.code !== code) : current.map((line) => (line.code === code ? { ...line, qty } : line)),
    );
  }, []);

  const value = useMemo<ShopValue | null>(() => {
    if (!db) return null;
    const cartCount = cart.reduce((sum, line) => sum + line.qty, 0);
    const quoteOf = (product: Product, qty = 1) => {
      const raw = db.products.find((item) => item.code === product.code);
      const listPrice = raw ? priceOf(raw, priceList) : product.retailPrice;
      return quoteLine({
        listPrice,
        qty,
        code: product.code,
        promos: db.promos,
        list: priceList,
      });
    };
    const cartTotal = cart.reduce((sum, line) => {
      const product = db.products.find((item) => item.code === line.code);
      if (!product) return sum;
      return sum + quoteOf(product, line.qty).lineTotal;
    }, 0);

    return {
      ready: true,
      mode: "local",
      products,
      promos: db.promos,
      settings: db.settings,
      session,
      orders: session?.role === "admin" ? db.orders : [],
      accounts: session?.role === "admin" ? db.accounts.filter((account) => account.role === "mayorista") : [],
      cart,
      priceList,
      setPriceList: (list) => {
        if (session?.role === "admin") setViewAs(list);
      },
      comandaOpen,
      setComandaOpen,
      add,
      setQty,
      remove: (code) => setCart((current) => current.filter((line) => line.code !== code)),
      clearCart: () => setCart([]),
      login: async (username, password) => {
        const key = username.trim().toLowerCase();
        const account = db.accounts.find((item) => item.username === key);
        if (!account || account.passwordHash !== (await passwordHash(key, password))) {
          return "Usuario o clave incorrectos.";
        }
        if (account.status !== "aprobado") return "Ese acceso todavía no está aprobado.";
        const nextToken = crypto.randomUUID();
        commit({ ...db, sessions: [...db.sessions, { token: nextToken, accountId: account.id }] });
        setToken(nextToken);
        localStorage.setItem(TOKEN_KEY, nextToken);
        if (account.role === "mayorista") setViewAs("mayorista");
        return null;
      },
      logout: () => {
        if (token) commit({ ...db, sessions: db.sessions.filter((item) => item.token !== token) });
        setToken(null);
        localStorage.removeItem(TOKEN_KEY);
        setViewAs("minorista");
      },
      requestAccess: async (input) => {
        const key = input.username.trim().toLowerCase();
        if (!key || input.password.length < 6) return "La clave necesita al menos 6 caracteres.";
        if (db.accounts.some((account) => account.username === key)) return "Ese usuario ya existe.";
        const account: Account = {
          id: crypto.randomUUID(),
          username: key,
          passwordHash: await passwordHash(key, input.password),
          role: "mayorista",
          name: input.name.trim(),
          business: input.business.trim(),
          phone: input.phone.trim(),
          zone: input.zone,
          paymentMode: input.paymentMode,
          status: "pendiente",
        };
        if (!account.name || !account.business || !account.phone) return "Completá nombre, negocio y teléfono.";
        commit({ ...db, accounts: [...db.accounts, account] });
        return null;
      },
      placeOrder: async (input) => {
        const empty = { error: null, text: "", url: null, number: "" };
        if (!input.customerName.trim() || !input.phone.trim()) {
          return { ...empty, error: "Faltan el nombre y el teléfono." };
        }
        if (cart.length === 0) return { ...empty, error: "La comanda está vacía." };
        if (priceList === "mayorista" && input.paymentMode === "cuenta_corriente" && session?.paymentMode !== "cuenta_corriente") {
          return { ...empty, error: "La cuenta corriente no está habilitada para este acceso." };
        }
        const lines: OrderLine[] = [];
        for (const line of cart) {
          const product = db.products.find((item) => item.code === line.code && item.active);
          if (!product) return { ...empty, error: `El código ${line.code} ya no está en la lista.` };
          if (product.availability === "agotado") return { ...empty, error: `${product.code} está agotado.` };
          const minimum = priceList === "mayorista" ? product.minWholesale : 1;
          if (line.qty < minimum) {
            return { ...empty, error: `${product.code} pide un mínimo de ${minimum} en esta lista.` };
          }
          const priced = quoteLine({
            listPrice: priceOf(product, priceList),
            qty: line.qty,
            code: product.code,
            promos: db.promos,
            list: priceList,
          });
          lines.push({
            code: product.code,
            name: product.name,
            qty: line.qty,
            unitPrice: priced.listPrice,
            lineTotal: priced.lineTotal,
            promoName: priced.promo ? priced.promo.badge || priced.promo.name : "",
            availability: product.availability,
          });
        }
        const order: Order = {
          id: crypto.randomUUID(),
          number: orderNumber(),
          createdAt: Date.now(),
          priceList,
          customerName: input.customerName.trim(),
          phone: input.phone.trim(),
          zone: input.zone,
          paymentMode: input.paymentMode,
          note: input.note.trim(),
          lines,
          total: lines.reduce((sum, line) => sum + lineCharge(line), 0),
          status: "nuevo",
        };
        commit({ ...db, orders: [order, ...db.orders] });
        setCart([]);
        const text = orderText(order);
        const nextReceipt = { text, url: whatsappLink(db.settings.whatsapp, text), number: order.number };
        setReceipt(nextReceipt);
        return { error: null, ...nextReceipt };
      },
      saveProduct: async (product) => {
        if (session?.role !== "admin") return "Hace falta entrar como administración.";
        const code = product.code.trim().toUpperCase();
        if (!code || !product.name.trim()) return "El código y el nombre son obligatorios.";
        const next = { ...product, code, wholesalePrice: product.wholesalePrice ?? 0 };
        const exists = db.products.some((item) => item.code === code);
        commit({
          ...db,
          products: exists
            ? db.products.map((item) => (item.code === code ? next : item))
            : [next, ...db.products],
        });
        return null;
      },
      removeProduct: async (code) => {
        if (session?.role !== "admin" || !db) return;
        commit({ ...db, products: db.products.filter((item) => item.code !== code) });
      },
      savePromo: async (promo) => {
        if (session?.role !== "admin") return "Hace falta entrar como administración.";
        const next = normalizePromo({ ...promo, id: promo.id || crypto.randomUUID() });
        const error = validatePromo(next);
        if (error) return error;
        const exists = db.promos.some((item) => item.id === next.id);
        commit({
          ...db,
          promos: exists ? db.promos.map((item) => (item.id === next.id ? next : item)) : [next, ...db.promos],
        });
        return null;
      },
      removePromo: async (id) => {
        if (session?.role !== "admin") return;
        commit({ ...db, promos: db.promos.filter((item) => item.id !== id) });
      },
      quote: quoteOf,
      setAccountStatus: async (id, status, paymentMode) => {
        if (session?.role !== "admin") return;
        commit({
          ...db,
          accounts: db.accounts.map((account) =>
            account.id === id ? { ...account, status, paymentMode } : account,
          ),
        });
      },
      saveSettings: async (settings) => {
        if (session?.role !== "admin") return;
        commit({ ...db, settings });
      },
      setOrderStatus: async (id, status) => {
        if (session?.role !== "admin") return;
        commit({
          ...db,
          orders: db.orders.map((order) => (order.id === id ? { ...order, status } : order)),
        });
      },
      changePassword: async (password) => {
        if (!session) return "No hay una sesión abierta.";
        if (password.length < 6) return "La clave necesita al menos 6 caracteres.";
        const account = db.accounts.find((item) => item.id === db.sessions.find((link) => link.token === token)?.accountId);
        if (!account) return "No se encontró el acceso.";
        const passwordHashValue = await passwordHash(account.username, password);
        commit({
          ...db,
          accounts: db.accounts.map((item) =>
            item.id === account.id ? { ...item, passwordHash: passwordHashValue } : item,
          ),
        });
        return null;
      },
      unitPrice: (product) => quoteOf(product, 1).lineTotal,
      lineTotal: (code) => {
        const line = cart.find((item) => item.code === code);
        const product = db.products.find((item) => item.code === code);
        if (!line || !product) return 0;
        return quoteOf(product, line.qty).lineTotal;
      },
      cartCount,
      cartTotal,
      receipt,
      clearReceipt: () => setReceipt(null),
    };
  }, [db, products, session, cart, priceList, comandaOpen, add, setQty, commit, token, receipt]);

  if (!value) {
    return <p className="booting">Abriendo la lista…</p>;
  }

  return <ShopContextProvider value={value}>{children}</ShopContextProvider>;
}
