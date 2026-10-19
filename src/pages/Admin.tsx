import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PromoDesk } from "./PromoDesk";
import { assetUrl, pesos, shrinkImage, whatsappLink } from "../shop/format";
import { lineCharge } from "../shop/pricing";
import { useShop } from "../shop/store";
import { AVAILABILITY_LABEL, type Availability, type Order, type PaymentMode, type Product } from "../shop/types";

const emptyProduct = (): Product => ({
  code: "",
  name: "",
  category: "Volcanes",
  brand: "",
  summary: "",
  detail: "",
  unit: "Unidad",
  retailPrice: 0,
  wholesalePrice: 0,
  minWholesale: 1,
  availability: "disponible",
  featured: false,
  pin: null,
  active: true,
  image: "/productos/gorila-loco.png",
});

type AdminTab = "productos" | "promos" | "pedidos" | "accesos" | "ajustes";

export function Admin() {
  const shop = useShop();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<AdminTab>("productos");

  const activeProductsCount = useMemo(
    () => shop.products.filter((item) => item.active).length,
    [shop.products],
  );
  const newOrdersCount = useMemo(
    () => shop.orders.filter((item) => item.status === "nuevo").length,
    [shop.orders],
  );
  const pendingAccountsCount = useMemo(
    () => shop.accounts.filter((item) => item.status === "pendiente").length,
    [shop.accounts],
  );
  const activePromosCount = useMemo(
    () => shop.promos.filter((item) => item.active).length,
    [shop.promos],
  );

  if (shop.session?.role !== "admin") {
    return (
      <section className="narrow admin-login-wrap">
        <div className="panel admin-login-card">
          <div className="admin-login-badge" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path
                d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 7a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-4 8c0-2 2.67-3.1 4-3.1S16 15 16 17H8z"
                fill="currentColor"
              />
            </svg>
          </div>
          <h1>Panel Boom</h1>
          <p className="admin-login-sub">
            Entrá para gestionar precios, fotos, stock, pedidos y accesos de revendedor desde el teléfono o la compu.
          </p>
          <form
            className="stack"
            onSubmit={async (event) => {
              event.preventDefault();
              setError((await shop.login(username, password)) ?? "");
            }}
          >
            <label>
              Usuario
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="admin"
                autoCapitalize="none"
                autoComplete="username"
                required
              />
            </label>
            <label>
              Clave
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </label>
            {error && <p className="form-error">{error}</p>}
            <button className="btn btn-block" type="submit">
              Entrar al panel
            </button>
          </form>
          <div className="admin-login-hint">
            <span>Acceso inicial: <strong>admin</strong> / <strong>boom2026</strong></span>
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setUsername("admin");
                setPassword("boom2026");
              }}
            >
              Completar
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="admin">
      <header className="admin-head">
        <div>
          <span className="code-chip">ADMINISTRACIÓN</span>
          <h1>Panel Boom</h1>
        </div>
        <div className="admin-head-actions">
          <Link className="chip" to="/catalogo">
            Ver tienda
          </Link>
          <button className="chip admin-logout-btn" type="button" onClick={shop.logout}>
            <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
              <path
                d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Salir
          </button>
        </div>
      </header>

      <div className="admin-kpis" aria-label="Resumen de la tienda">
        <button type="button" className="admin-kpi" onClick={() => setTab("productos")}>
          <span className="admin-kpi-label">Productos</span>
          <strong>{activeProductsCount} activos</strong>
        </button>
        <button type="button" className="admin-kpi" onClick={() => setTab("promos")}>
          <span className="admin-kpi-label">Promos</span>
          <strong>{activePromosCount > 0 ? `${activePromosCount} activas` : "Ninguna"}</strong>
        </button>
        <button type="button" className="admin-kpi" onClick={() => setTab("pedidos")}>
          <span className="admin-kpi-label">Pedidos</span>
          <strong>{newOrdersCount > 0 ? `${newOrdersCount} nuevos` : `${shop.orders.length} total`}</strong>
        </button>
        <button type="button" className="admin-kpi" onClick={() => setTab("accesos")}>
          <span className="admin-kpi-label">Revendedores</span>
          <strong>
            {pendingAccountsCount > 0 ? `${pendingAccountsCount} pendientes` : `${shop.accounts.length} cuentas`}
          </strong>
        </button>
        <button type="button" className="admin-kpi" onClick={() => setTab("ajustes")}>
          <span className="admin-kpi-label">WhatsApp</span>
          <strong>{shop.settings.whatsapp || "Sin cargar"}</strong>
        </button>
      </div>

      {!shop.settings.pricesConfirmed && (
        <div className="form-error admin-alert">
          <p>
            Los precios actuales son de arranque. Revisalos antes de compartir el catálogo con clientes.
          </p>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => shop.saveSettings({ ...shop.settings, pricesConfirmed: true })}
          >
            Confirmar precios
          </button>
        </div>
      )}

      <nav className="admin-tabs" role="tablist" aria-label="Secciones del panel">
        <button
          className={tab === "productos" ? "admin-tab is-on" : "admin-tab"}
          type="button"
          role="tab"
          aria-selected={tab === "productos"}
          onClick={() => setTab("productos")}
        >
          <span className="admin-tab-icon-wrap">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span className="admin-tab-badge">{shop.products.length}</span>
          </span>
          <span className="admin-tab-label">Productos</span>
        </button>

        <button
          className={tab === "promos" ? "admin-tab is-on" : "admin-tab"}
          type="button"
          role="tab"
          aria-selected={tab === "promos"}
          onClick={() => setTab("promos")}
        >
          <span className="admin-tab-icon-wrap">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" />
            </svg>
            {activePromosCount > 0 && <span className="admin-tab-badge">{activePromosCount}</span>}
          </span>
          <span className="admin-tab-label">Promos</span>
        </button>

        <button
          className={tab === "pedidos" ? "admin-tab is-on" : "admin-tab"}
          type="button"
          role="tab"
          aria-selected={tab === "pedidos"}
          onClick={() => setTab("pedidos")}
        >
          <span className="admin-tab-icon-wrap">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {newOrdersCount > 0 && <span className="admin-tab-badge is-alert">{newOrdersCount}</span>}
          </span>
          <span className="admin-tab-label">Pedidos</span>
        </button>

        <button
          className={tab === "accesos" ? "admin-tab is-on" : "admin-tab"}
          type="button"
          role="tab"
          aria-selected={tab === "accesos"}
          onClick={() => setTab("accesos")}
        >
          <span className="admin-tab-icon-wrap">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm14 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {pendingAccountsCount > 0 && <span className="admin-tab-badge is-alert">{pendingAccountsCount}</span>}
          </span>
          <span className="admin-tab-label">Revendedores</span>
        </button>

        <button
          className={tab === "ajustes" ? "admin-tab is-on" : "admin-tab"}
          type="button"
          role="tab"
          aria-selected={tab === "ajustes"}
          onClick={() => setTab("ajustes")}
        >
          <span className="admin-tab-icon-wrap">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
              <path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="admin-tab-label">Ajustes</span>
        </button>

        <Link className="admin-tab admin-tab-store" to="/">
          <span className="admin-tab-icon-wrap">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline points="9 22 9 12 15 12 15 22" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </span>
          <span className="admin-tab-label">Tienda</span>
        </Link>
      </nav>

      {tab === "productos" && <Products />}
      {tab === "promos" && <PromoDesk />}
      {tab === "pedidos" && <Orders />}
      {tab === "accesos" && <Accounts />}
      {tab === "ajustes" && <SettingsForm />}
    </section>
  );
}

function Products() {
  const { products, saveProduct, removeProduct } = useShop();
  const [draft, setDraft] = useState<Product | null>(null);
  const [original, setOriginal] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (item) =>
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q),
    );
  }, [products, search]);

  useEffect(() => {
    if (!draft) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDraft(null);
        setOriginal(null);
        setError("");
      }
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [draft]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    const result = await saveProduct({
      ...draft,
      retailPrice: Number(draft.retailPrice),
      wholesalePrice: Number(draft.wholesalePrice ?? 0),
      minWholesale: Number(draft.minWholesale),
      pin: draft.pin ? Number(draft.pin) : null,
    });
    if (result) {
      setError(result);
      return;
    }
    if (original && original !== draft.code.trim().toUpperCase()) await removeProduct(original);
    setError("");
    setDraft(null);
    setOriginal(null);
  }

  return (
    <div className="admin-section">
      <div className="admin-toolbar">
        <div className="admin-search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar código, nombre o categoría…"
            aria-label="Buscar producto"
          />
        </div>
        <button
          className="btn admin-add-btn"
          type="button"
          onClick={() => {
            setError("");
            setDraft(emptyProduct());
            setOriginal(null);
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span>Nuevo producto</span>
        </button>
      </div>

      <ul className="admin-product-list">
        {filteredProducts.map((product) => (
          <li key={product.code} className={!product.active ? "admin-product-card is-hidden" : "admin-product-card"}>
            <img src={assetUrl(product.image)} alt={product.name} width="72" height="72" />
            <div className="admin-product-body">
              <div className="admin-product-badges">
                <span className="code-chip">{product.code}</span>
                <span className={`badge badge-${product.availability}`}>
                  {AVAILABILITY_LABEL[product.availability]}
                </span>
                {product.pin != null && <span className="admin-pin-tag">Portada #{product.pin}</span>}
                {!product.active && <span className="admin-hidden-tag">Oculto</span>}
              </div>
              <h2>{product.name}</h2>
              <p className="admin-product-meta">
                {product.category} · {product.unit}
              </p>
              <div className="admin-product-prices">
                <span>
                  <small>Mostrador</small> <strong>{pesos(product.retailPrice)}</strong>
                </span>
                {product.wholesalePrice != null && (
                  <span>
                    <small>Mayorista</small> <strong>{pesos(product.wholesalePrice)}</strong>
                  </span>
                )}
              </div>
            </div>
            <button
              className="btn btn-sm admin-edit-btn"
              type="button"
              onClick={() => {
                setError("");
                setDraft(product);
                setOriginal(product.code);
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
                <path
                  d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Editar</span>
            </button>
          </li>
        ))}
      </ul>

      {draft && (
        <div className="admin-modal-root" role="dialog" aria-modal="true" aria-label={original ? `Editar ${original}` : "Nuevo producto"}>
          <button
            type="button"
            className="drawer-backdrop"
            aria-label="Cerrar editor"
            onClick={() => {
              setDraft(null);
              setOriginal(null);
              setError("");
            }}
          />
          <form className="admin-modal" onSubmit={onSave}>
            <div className="admin-modal-head">
              <div>
                <span className="code-chip">{original ? `EDITANDO ${original}` : "NUEVO"}</span>
                <h2>{draft.name || "Producto"}</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Cerrar"
                onClick={() => {
                  setDraft(null);
                  setOriginal(null);
                  setError("");
                }}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="admin-modal-body">
              <div className="admin-photo-picker">
                {draft.image && <img className="preview" src={assetUrl(draft.image)} alt="Vista previa del producto" />}
                <div>
                  <label className="btn btn-sm admin-upload-btn">
                    <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
                      <path
                        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Cambiar foto
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        setDraft({ ...draft, image: await shrinkImage(file) });
                      }}
                    />
                  </label>
                  <p className="admin-photo-hint">Se ajusta automáticamente para cargar rápido.</p>
                </div>
              </div>

              <div className="admin-form-grid">
                <label>
                  Código
                  <input
                    value={draft.code}
                    onChange={(event) => setDraft({ ...draft, code: event.target.value })}
                    placeholder="V11"
                    autoCapitalize="characters"
                    required
                  />
                </label>
                <label>
                  Categoría
                  <input
                    value={draft.category}
                    onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                    placeholder="Volcanes"
                    required
                  />
                </label>
              </div>

              <label>
                Nombre del producto
                <input
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  placeholder="Gorila Loco"
                  required
                />
              </label>

              <div className="admin-form-grid">
                <label>
                  Precio mostrador ($)
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={draft.retailPrice}
                    onChange={(event) => setDraft({ ...draft, retailPrice: Number(event.target.value) })}
                  />
                </label>
                <label>
                  Precio revendedor ($)
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={draft.wholesalePrice ?? 0}
                    onChange={(event) => setDraft({ ...draft, wholesalePrice: Number(event.target.value) })}
                  />
                </label>
              </div>

              <div className="admin-form-grid">
                <label>
                  Disponibilidad
                  <select
                    value={draft.availability}
                    onChange={(event) => setDraft({ ...draft, availability: event.target.value as Availability })}
                  >
                    <option value="disponible">Disponible</option>
                    <option value="consultar">A consultar</option>
                    <option value="agotado">Agotado</option>
                  </select>
                </label>
                <label>
                  Mínimo mayorista
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={draft.minWholesale}
                    onChange={(event) => setDraft({ ...draft, minWholesale: Number(event.target.value) })}
                  />
                </label>
              </div>

              <div className="admin-form-grid">
                <label>
                  Marca
                  <input
                    value={draft.brand}
                    onChange={(event) => setDraft({ ...draft, brand: event.target.value })}
                    placeholder="Cienfuegos"
                  />
                </label>
                <label>
                  Presentación
                  <input
                    value={draft.unit}
                    onChange={(event) => setDraft({ ...draft, unit: event.target.value })}
                    placeholder="Caja de 16 tiros"
                  />
                </label>
              </div>

              <div className="admin-form-grid">
                <label>
                  Orden en portada (1-5)
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    placeholder="Vacío si no va"
                    value={draft.pin ?? ""}
                    onChange={(event) => setDraft({ ...draft, pin: event.target.value ? Number(event.target.value) : null })}
                  />
                </label>
                <label className="check admin-check-box">
                  <input
                    type="checkbox"
                    checked={draft.active}
                    onChange={(event) => setDraft({ ...draft, active: event.target.checked })}
                  />
                  <span>Visible en la tienda</span>
                </label>
              </div>

              <label>
                Resumen corto
                <input
                  value={draft.summary}
                  onChange={(event) => setDraft({ ...draft, summary: event.target.value })}
                  placeholder="Volcán de 16 tiros."
                />
              </label>

              <label>
                Detalle completo
                <textarea
                  value={draft.detail}
                  onChange={(event) => setDraft({ ...draft, detail: event.target.value })}
                  rows={3}
                />
              </label>

              {error && <p className="form-error">{error}</p>}
            </div>

            <div className="admin-modal-foot">
              {original && (
                <button
                  className="text-button admin-delete-btn"
                  type="button"
                  onClick={async () => {
                    if (window.confirm(`¿Quitar ${original} de la lista?`)) {
                      await removeProduct(original);
                      setDraft(null);
                      setOriginal(null);
                    }
                  }}
                >
                  Eliminar
                </button>
              )}
              <button className="btn btn-block" type="submit">
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Orders() {
  const { orders, setOrderStatus } = useShop();
  if (orders.length === 0) {
    return (
      <div className="empty">
        <h2>Sin pedidos registrados</h2>
        <p>Cuando entren pedidos desde la tienda van a aparecer acá.</p>
      </div>
    );
  }
  return (
    <ul className="order-list">
      {orders.map((order) => {
        const clientWa = whatsappLink(
          order.phone,
          `Hola ${order.customerName}, te escribimos de Pirotecnia Boom por tu pedido ${order.number} (${pesos(order.total)}).`,
        );
        return (
          <li key={order.id} className="admin-order-card">
            <div className="admin-order-head">
              <div>
                <span className="code-chip">{order.number}</span>
                <h2>{pesos(order.total)}</h2>
              </div>
              <span className={`badge badge-${order.status === "nuevo" ? "consultar" : order.status === "en_curso" ? "disponible" : "agotado"}`}>
                {order.status === "nuevo" ? "Nuevo" : order.status === "en_curso" ? "En curso" : "Cerrado"}
              </span>
            </div>
            <p className="admin-order-meta">
              <strong>{order.customerName}</strong> · {order.phone} · {order.zone}
            </p>
            <p className="admin-order-meta">
              {new Date(order.createdAt).toLocaleString("es-AR")} · Lista {order.priceList} ·{" "}
              {order.paymentMode === "contado" ? "Contado" : "Cuenta corriente"}
            </p>
            <ul className="admin-order-lines">
              {order.lines.map((line) => (
                <li key={line.code}>
                  <span>
                    <strong>{line.code}</strong> {line.name} × {line.qty}
                    {line.promoName ? ` · ${line.promoName}` : ""}
                  </span>
                  <span>{pesos(lineCharge(line))}</span>
                </li>
              ))}
            </ul>
            {order.note && <p className="admin-order-note">Nota: {order.note}</p>}
            <div className="admin-order-foot">
              <label>
                Estado
                <select value={order.status} onChange={(event) => setOrderStatus(order.id, event.target.value as Order["status"])}>
                  <option value="nuevo">Nuevo</option>
                  <option value="en_curso">En curso</option>
                  <option value="cerrado">Cerrado</option>
                </select>
              </label>
              {clientWa && (
                <a className="btn btn-sm" href={clientWa} target="_blank" rel="noreferrer">
                  Responder por WhatsApp
                </a>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Accounts() {
  const { accounts, setAccountStatus } = useShop();
  if (accounts.length === 0) {
    return (
      <div className="empty">
        <h2>Sin cuentas de revendedor</h2>
        <p>Las solicitudes de acceso mayorista aparecerán en esta sección.</p>
      </div>
    );
  }
  return (
    <ul className="order-list">
      {accounts.map((account) => (
        <li key={account.id} className="admin-order-card">
          <div className="admin-order-head">
            <div>
              <span className="code-chip">@{account.username}</span>
              <h2>{account.business}</h2>
            </div>
            <span
              className={`badge ${
                account.status === "aprobado"
                  ? "badge-disponible"
                  : account.status === "pendiente"
                    ? "badge-consultar"
                    : "badge-agotado"
              }`}
            >
              {account.status}
            </span>
          </div>
          <p className="admin-order-meta">
            <strong>{account.name}</strong> · {account.phone || "Sin teléfono"} · {account.zone}
          </p>
          <div className="admin-order-foot">
            <label>
              Pago habilitado
              <select
                value={account.paymentMode}
                onChange={(event) =>
                  setAccountStatus(account.id, account.status, event.target.value as PaymentMode)
                }
              >
                <option value="contado">Contado</option>
                <option value="cuenta_corriente">Cuenta corriente</option>
              </select>
            </label>
            <div className="row-actions">
              <button className="btn btn-sm" type="button" onClick={() => setAccountStatus(account.id, "aprobado", account.paymentMode)}>
                Aprobar
              </button>
              <button className="chip" type="button" onClick={() => setAccountStatus(account.id, "rechazado", account.paymentMode)}>
                Rechazar
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function SettingsForm() {
  const { settings, saveSettings, changePassword } = useShop();
  const [draft, setDraft] = useState(settings);
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");

  return (
    <div className="admin-settings-grid">
      <form
        className="panel stack"
        onSubmit={async (event) => {
          event.preventDefault();
          await saveSettings(draft);
          setNote("Ajustes de la tienda guardados.");
        }}
      >
        <h2>Datos de la tienda</h2>
        <label>
          WhatsApp (con código de área, sin 0 ni 15)
          <input
            type="tel"
            inputMode="tel"
            value={draft.whatsapp}
            onChange={(event) => setDraft({ ...draft, whatsapp: event.target.value })}
            placeholder="3870000000"
          />
        </label>
        <label>
          Ciudad / Ubicación
          <input value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })} />
        </label>
        <label>
          Aviso legal al pie
          <textarea value={draft.notice} onChange={(event) => setDraft({ ...draft, notice: event.target.value })} rows={3} />
        </label>
        <label className="check admin-check-box">
          <input
            type="checkbox"
            checked={draft.pricesConfirmed}
            onChange={(event) => setDraft({ ...draft, pricesConfirmed: event.target.checked })}
          />
          <span>Ya actualicé los precios de arranque</span>
        </label>
        <button className="btn btn-block" type="submit">
          Guardar ajustes
        </button>
      </form>

      <div className="panel stack">
        <h2>Seguridad del panel</h2>
        <p className="admin-login-sub">Cambiá la contraseña del usuario administrador (`admin`).</p>
        <label>
          Nueva clave (mínimo 6 caracteres)
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Nueva contraseña"
          />
        </label>
        <button
          className="btn btn-block"
          type="button"
          onClick={async () => {
            const res = await changePassword(password);
            setNote(res ?? "Clave actualizada correctamente.");
            if (!res) setPassword("");
          }}
        >
          Actualizar clave
        </button>
        {note && <p className="form-note">{note}</p>}
      </div>
    </div>
  );
}
