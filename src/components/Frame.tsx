import { Link, NavLink } from "react-router-dom";
import { useEffect } from "react";
import { PriceTag } from "./PriceTag";
import { ThemeToggle } from "./ThemeToggle";
import { assetUrl, pesos, whatsappLink } from "../shop/format";
import { AVAILABILITY_LABEL } from "../shop/types";
import { useShop } from "../shop/store";

export function Frame({ children }: { children: React.ReactNode }) {
  const shop = useShop();
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
    unitPrice,
    setPriceList,
    clearCart,
  } = shop;

  const waMessage = [
    "Hola Pirotecnia Boom, quiero hacer este pedido:",
    "",
    ...cart
      .map((line) => {
        const product = products.find((item) => item.code === line.code);
        if (!product) return "";
        const flag = product.availability === "consultar" ? " (a consultar)" : "";
        return `• ${product.code} ${product.name} x ${line.qty} — ${pesos(unitPrice(product) * line.qty)}${flag}`;
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
                          {AVAILABILITY_LABEL[product.availability]} · <PriceTag product={product} />
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
