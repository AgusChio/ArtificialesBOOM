import { ConvexProvider, ConvexReactClient, useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../../convex/_generated/api";
import { whatsappLink } from "./format";
import { ShopContextProvider, type ShopValue } from "./store";
import type { AccessRequest, CartLine, CheckoutInput, Order, PaymentMode, PriceList, Product, Session, Settings } from "./types";

const CART_KEY = "boom-cart-v1";
const TOKEN_KEY = "boom-convex-token";

function readCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

export function ConvexGate({ url, children }: { url: string; children: ReactNode }) {
  const client = useMemo(() => new ConvexReactClient(url), [url]);
  return (
    <ConvexProvider client={client}>
      <ConvexShop>{children}</ConvexShop>
    </ConvexProvider>
  );
}

function ConvexShop({ children }: { children: ReactNode }) {
  const bootstrap = useMutation(api.boom.bootstrap);
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [cart, setCart] = useState<CartLine[]>(readCart);
  const [viewAs, setViewAs] = useState<PriceList>("minorista");
  const [comandaOpen, setComandaOpen] = useState(false);
  const [receipt, setReceipt] = useState<ShopValue["receipt"]>(null);

  useEffect(() => {
    bootstrap({}).finally(() => setReady(true));
  }, [bootstrap]);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const products = useQuery(api.boom.listProducts, ready ? { token: token ?? undefined } : "skip") as Product[] | undefined;
  const settings = useQuery(api.boom.getSettings, ready ? {} : "skip") as Settings | null | undefined;
  const session = useQuery(api.boom.currentSession, ready && token ? { token } : "skip") as Session | null | undefined;
  const orders = useQuery(api.boom.listOrders, session?.role === "admin" && token ? { token } : "skip") as Order[] | undefined;
  const accounts = useQuery(api.boom.listAccounts, session?.role === "admin" && token ? { token } : "skip");

  const loginMutation = useMutation(api.boom.login);
  const logoutMutation = useMutation(api.boom.logout);
  const requestMutation = useMutation(api.boom.requestAccess);
  const orderMutation = useMutation(api.boom.placeOrder);
  const saveMutation = useMutation(api.boom.saveProduct);
  const removeMutation = useMutation(api.boom.removeProduct);
  const statusMutation = useMutation(api.boom.setAccountStatus);
  const settingsMutation = useMutation(api.boom.saveSettings);
  const orderStatusMutation = useMutation(api.boom.setOrderStatus);
  const passwordMutation = useMutation(api.boom.changePassword);
  const uploadUrl = useMutation(api.boom.generateUploadUrl);

  const priceList: PriceList =
    session?.role === "mayorista" ? "mayorista" : session?.role === "admin" ? viewAs : "minorista";

  const list = products ?? [];
  const currentSettings = settings ?? {
    whatsapp: "",
    city: "Salta",
    notice: "Prohibida la venta y el uso a menores de 16 años.",
    pricesConfirmed: false,
  };

  const add = useCallback(
    (code: string, qty = 1) => {
      const product = list.find((item) => item.code.toLowerCase() === code.toLowerCase() && item.active);
      if (!product) return "Ese código no está en la lista.";
      if (product.availability === "agotado") return "Ese código está agotado.";
      const minimum = priceList === "mayorista" ? product.minWholesale : 1;
      setCart((current) => {
        const found = current.find((line) => line.code === product.code);
        if (!found) return [...current, { code: product.code, qty: Math.max(qty, minimum) }];
        return current.map((line) => (line.code === product.code ? { ...line, qty: line.qty + qty } : line));
      });
      setComandaOpen(true);
      setReceipt(null);
      return null;
    },
    [list, priceList],
  );

  const value = useMemo<ShopValue>(() => {
    const cartCount = cart.reduce((sum, line) => sum + line.qty, 0);
    const cartTotal = cart.reduce((sum, line) => {
      const product = list.find((item) => item.code === line.code);
      if (!product) return sum;
      const amount = priceList === "mayorista" ? (product.wholesalePrice ?? product.retailPrice) : product.retailPrice;
      return sum + amount * line.qty;
    }, 0);
    return {
      ready: ready && products !== undefined && settings !== undefined,
      mode: "convex",
      products: list,
      settings: currentSettings,
      session: session ?? null,
      orders: orders ?? [],
      accounts: accounts ?? [],
      cart,
      priceList,
      setPriceList: (next) => {
        if (session?.role === "admin") setViewAs(next);
      },
      comandaOpen,
      setComandaOpen,
      add,
      setQty: (code, qty) =>
        setCart((current) => (qty <= 0 ? current.filter((line) => line.code !== code) : current.map((line) => (line.code === code ? { ...line, qty } : line)))),
      remove: (code) => setCart((current) => current.filter((line) => line.code !== code)),
      clearCart: () => setCart([]),
      login: async (username, password) => {
        const result = await loginMutation({ username, password });
        if (result.error || !result.session) return result.error ?? "No se pudo entrar.";
        setToken(result.session.token);
        localStorage.setItem(TOKEN_KEY, result.session.token);
        return null;
      },
      logout: () => {
        if (token) void logoutMutation({ token });
        setToken(null);
        localStorage.removeItem(TOKEN_KEY);
        setViewAs("minorista");
      },
      requestAccess: async (input: AccessRequest) => requestMutation(input),
      placeOrder: async (input: CheckoutInput) => {
        const result = await orderMutation({
          token: token ?? undefined,
          ...input,
          lines: cart.map((line) => ({ code: line.code, qty: line.qty })),
        });
        if (result.error) return { error: result.error, text: "", url: null, number: "" };
        setCart([]);
        const nextReceipt = {
          text: result.text,
          url: whatsappLink(currentSettings.whatsapp, result.text),
          number: result.number,
        };
        setReceipt(nextReceipt);
        return { error: null, ...nextReceipt };
      },
      saveProduct: async (product: Product) => {
        if (!token) return "Hace falta entrar como administración.";
        let imageId: string | undefined;
        if (product.image.startsWith("data:")) {
          const target = await uploadUrl({ token });
          const blob = await (await fetch(product.image)).blob();
          const response = await fetch(target, {
            method: "POST",
            headers: { "Content-Type": blob.type },
            body: blob,
          });
          const payload = (await response.json()) as { storageId: string };
          imageId = payload.storageId;
        }
        return saveMutation({
          token,
          code: product.code,
          name: product.name,
          category: product.category,
          brand: product.brand,
          summary: product.summary,
          detail: product.detail,
          unit: product.unit,
          retailPrice: product.retailPrice,
          wholesalePrice: product.wholesalePrice ?? 0,
          minWholesale: product.minWholesale,
          availability: product.availability,
          featured: product.featured,
          pin: product.pin,
          active: product.active,
          image: imageId ? product.image : product.image,
          ...(imageId ? { imageId } : {}),
        });
      },
      removeProduct: async (code) => {
        if (token) await removeMutation({ token, code });
      },
      setAccountStatus: async (id, status, paymentMode: PaymentMode) => {
        if (token) await statusMutation({ token, id, status, paymentMode });
      },
      saveSettings: async (next: Settings) => {
        if (token) await settingsMutation({ token, ...next });
      },
      setOrderStatus: async (id, status: Order["status"]) => {
        if (token) await orderStatusMutation({ token, id, status });
      },
      changePassword: async (password) => {
        if (!token) return "No hay una sesión abierta.";
        return passwordMutation({ token, password });
      },
      unitPrice: (product) =>
        priceList === "mayorista" ? (product.wholesalePrice ?? product.retailPrice) : product.retailPrice,
      lineTotal: (code) => {
        const line = cart.find((item) => item.code === code);
        const product = list.find((item) => item.code === code);
        if (!line || !product) return 0;
        const amount = priceList === "mayorista" ? (product.wholesalePrice ?? product.retailPrice) : product.retailPrice;
        return amount * line.qty;
      },
      cartCount,
      cartTotal,
      receipt,
      clearReceipt: () => setReceipt(null),
    };
  }, [
    accounts,
    add,
    cart,
    comandaOpen,
    currentSettings,
    list,
    loginMutation,
    logoutMutation,
    orderMutation,
    orderStatusMutation,
    orders,
    passwordMutation,
    priceList,
    products,
    ready,
    removeMutation,
    requestMutation,
    saveMutation,
    session,
    settings,
    settingsMutation,
    statusMutation,
    token,
    uploadUrl,
    receipt,
  ]);

  if (!value.ready) return <p className="booting">Abriendo la lista…</p>;
  return <ShopContextProvider value={value}>{children}</ShopContextProvider>;
}
