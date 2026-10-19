import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { PriceTag } from "./PriceTag";
import { ThemeToggle } from "./ThemeToggle";
import { assetUrl, pesos, whatsappLink } from "../shop/format";
import { formatCartLine } from "../shop/pricing";
import { AVAILABILITY_LABEL } from "../shop/types";
import { useShop } from "../shop/store";

export function Frame({ children }: { children: React.ReactNode }) {
  const shop = useShop();
  const location = useLocation();
  const {
    cart,
    products,
    cartCount,
    cartTotal,
    comandaOpen,
    setComandaOpen,
    setQty,
    remove,
    priceList,
    session,
    settings,
    quote,
    setPriceList,
    clearCart,
  } = shop;

  const isAdminDashboard = location.pathname.startsWith("/admin") && session?.role === "admin";

  const waMessage = [
    "Hola Pirotecnia Boom, quiero hacer este pedido:",
    "",
    ...cart
      .map((line) => {
        const product = products.find((item) => item.code === line.code);
        if (!product) return "";
        return formatCartLine(product, line.qty, quote(product, line.qty));
      })
      .filter(Boolean),
    "",
    `Total (${cartCount} ${cartCount === 1 ? "ítem" : "ítems"}): ${pesos(cartTotal)}`,
  ].join("\n");

  const directWaUrl =
    whatsappLink(settings.whatsapp, waMessage) ??
    `https://api.whatsapp.com/send?text=${encodeURIComponent(waMessage)}`;

  useEffect(() => {
    if (!comandaOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setComandaOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [comandaOpen, setComandaOpen]);

  return (
    <>
      <a className="skip" href="#contenido">
        Saltar al contenido
      </a>
      <header className="bar">
        <Link to="/" className="brand" aria-label="Pirotecnia Boom, inicio">
          <img src={assetUrl("/marca/logo.png")} alt="Pirotecnia Boom" width="78" height="52" />
        </Link>
        <nav className="nav" aria-label="Secciones">
          <NavLink to="/catalogo">Catálogo</NavLink>
          <NavLink to="/mayorista">Mayorista</NavLink>
          <NavLink to="/aviso">Aviso</NavLink>
          <NavLink to="/admin">Panel</NavLink>
        </nav>
        <div className="bar-actions">
          <ThemeToggle />
          <button
            className="btn cart-btn"
            type="button"
            onClick={() => setComandaOpen(true)}
            aria-label={cartCount > 0 ? `Abrir carrito, ${cartCount} ítems` : "Abrir carrito"}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="cart-icon">
              <path
                d="M3 4h2.4l2.2 10.2a1.6 1.6 0 0 0 1.6 1.3h7.9a1.6 1.6 0 0 0 1.6-1.2L20.5 8H6.3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="9.5" cy="19.5" r="1.4" fill="currentColor" />
              <circle cx="17" cy="19.5" r="1.4" fill="currentColor" />
            </svg>
            <span className="cart-label">Carrito</span>
            {cartCount > 0 && (
              <span className="cart-count" key={cartCount}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>
      {session?.role === "mayorista" && (
        <p className="strip strip-field">
          Lista revendedor de {session.business}. Zona {session.zone}.{" "}
          {session.paymentMode === "cuenta_corriente" ? "Cuenta corriente habilitada." : "Pago de contado."}
        </p>
      )}
      {session?.role === "admin" && (
        <p className="strip">
          Estás viendo la lista {priceList === "mayorista" ? "revendedor" : "mostrador"}.
          <button
            type="button"
            className="text-button"
            onClick={() => setPriceList(priceList === "minorista" ? "mayorista" : "minorista")}
          >
            Cambiar lista
          </button>
        </p>
      )}
      <main id="contenido">{children}</main>
      <footer className="quiet">
        <p className="boom-close" aria-hidden="true">
          BOOM
        </p>
        <div className="quiet-line">
          <p>Fuegos artificiales en Salta</p>
          <p className="quiet-links">
            <Link to="/catalogo">Catálogo</Link>
            <Link to="/mayorista">Mayorista</Link>
            <Link to="/aviso">Aviso</Link>
            <Link to="/admin">Panel</Link>
          </p>
          <p>Prohibida la venta a menores de 16 años · 2026</p>
        </div>
      </footer>
      {!isAdminDashboard && (
        <nav className="bottom-nav" aria-label="Navegación móvil">
          <NavLink to="/" end className="bottom-nav-item">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 3l8 6.5v10a1.5 1.5 0 0 1-1.5 1.5h-4.5v-6h-4v6H5.5A1.5 1.5 0 0 1 4 19.5v-10L12 3z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Inicio</span>
          </NavLink>
          <NavLink to="/catalogo" className="bottom-nav-item">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" />
              <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" />
              <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" />
              <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span>Catálogo</span>
          </NavLink>
          <NavLink to="/mayorista" className="bottom-nav-item">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="7" cy="7" r="1.5" fill="currentColor" />
            </svg>
            <span>Mayorista</span>
          </NavLink>
          <NavLink to="/aviso" className="bottom-nav-item">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>Aviso</span>
          </NavLink>
          <NavLink to="/admin" className="bottom-nav-item">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Panel</span>
          </NavLink>
        </nav>
      )}
      {comandaOpen && (
        <div className="drawer-root">
          <button className="drawer-backdrop" type="button" aria-label="Cerrar carrito" onClick={() => setComandaOpen(false)} />
          <aside className="drawer" role="dialog" aria-modal="true" aria-label="Carrito">
            <div className="drawer-head">
              <div>
                <h2>Carrito</h2>
                <p className="drawer-list">
                  {cartCount === 0
                    ? "0 ítems"
                    : `${cartCount} ${cartCount === 1 ? "ítem" : "ítems"} en tu pedido`}
                </p>
              </div>
              <button className="icon-button" type="button" onClick={() => setComandaOpen(false)} aria-label="Cerrar" autoFocus>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            {cart.length === 0 ? (
              <div className="drawer-empty">
                <p>Todavía no hay productos en el carrito. Elegí uno de la lista.</p>
                <Link className="btn" to="/catalogo" onClick={() => setComandaOpen(false)}>
                  Ir al catálogo
                </Link>
              </div>
            ) : (
              <ul className="comanda">
                {cart.map((line) => {
                  const product = products.find((item) => item.code === line.code);
                  if (!product) return null;
                  return (
                    <li key={line.code}>
                      <img src={assetUrl(product.image)} alt="" width="72" height="72" />
                      <div className="comanda-info">
                        <strong>
                          <span className="code-chip">{product.code}</span> {product.name}
                        </strong>
                        <span className="comanda-meta">
                          {AVAILABILITY_LABEL[product.availability]} · <PriceTag product={product} qty={line.qty} />
                        </span>
                        <div className="stepper">
                          <button type="button" onClick={() => setQty(line.code, line.qty - 1)} aria-label={`Quitar uno de ${product.code}`}>
                            −
                          </button>
                          <span aria-live="polite">{line.qty}</span>
                          <button type="button" onClick={() => setQty(line.code, line.qty + 1)} aria-label={`Sumar uno de ${product.code}`}>
                            +
                          </button>
                        </div>
                      </div>
                      <button className="text-button" type="button" onClick={() => remove(line.code)}>
                        Quitar
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {cart.length > 0 && (
              <div className="drawer-foot">
                <p className="drawer-total">
                  <span>Total ({cartCount} {cartCount === 1 ? "ítem" : "ítems"})</span>
                  <strong>{pesos(cartTotal)}</strong>
                </p>
                <a
                  className="btn btn-block"
                  href={directWaUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setComandaOpen(false)}
                >
                  Enviar pedido por WhatsApp
                </a>
                <button className="text-button" type="button" onClick={clearCart}>
                  Vaciar carrito
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
