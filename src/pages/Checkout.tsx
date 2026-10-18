import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { pesos } from "../shop/format";
import { useShop } from "../shop/store";
import { ZONES, type PaymentMode } from "../shop/types";

export function Checkout() {
  const { cart, products, placeOrder, priceList, session, settings, unitPrice, receipt, clearReceipt } = useShop();
  const [customerName, setCustomerName] = useState(session?.name ?? "");
  const [phone, setPhone] = useState("");
  const [zone, setZone] = useState(session?.zone || ZONES[0]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(
    session?.paymentMode === "cuenta_corriente" ? "cuenta_corriente" : "contado",
  );
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const accountCanCredit = session?.role === "mayorista" && session.paymentMode === "cuenta_corriente";

  useEffect(() => {
    if (receipt) window.scrollTo(0, 0);
  }, [receipt]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const result = await placeOrder({ customerName, phone, zone, paymentMode, note });
    if (result.error) setError(result.error);
  }

  if (receipt) {
    return (
      <section className="narrow">
        <h1>Pedido {receipt.number}</h1>
        <p className="statement">Quedó guardado. El mensaje ya está armado para WhatsApp.</p>
        <pre className="slip">{receipt.text}</pre>
        <div className="row-actions">
          {receipt.url ? (
            <a className="btn" href={receipt.url} target="_blank" rel="noreferrer">
              Abrir WhatsApp
            </a>
          ) : (
            <p>Falta el número de WhatsApp. Cargalo en el panel y volvé a copiar el pedido.</p>
          )}
          <button
            className="btn"
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(receipt.text);
                setCopied(true);
                setError("");
              } catch {
                setError("No se pudo copiar. Seleccioná el texto del pedido y copialo a mano.");
              }
            }}
          >
            {copied ? "Copiado" : "Copiar pedido"}
          </button>
        </div>
        {error && <p className="form-error">{error}</p>}
        <p>
          <Link to="/catalogo" onClick={clearReceipt}>
            Seguir mirando
          </Link>
        </p>
      </section>
    );
  }

  if (cart.length === 0) {
    return (
      <section className="narrow">
        <h1>La comanda está vacía</h1>
        <p>Sumá códigos desde el catálogo y volvé para mandar el pedido.</p>
        <Link className="btn" to="/catalogo">
          Ir al catálogo
        </Link>
      </section>
    );
  }

  const total = cart.reduce((sum, line) => {
    const product = products.find((item) => item.code === line.code);
    return product ? sum + unitPrice(product) * line.qty : sum;
  }, 0);

  return (
    <section className="narrow">
      <h1>Completar pedido</h1>
      <p className="statement">
        Lista {priceList === "mayorista" ? "revendedor" : "mostrador"}. Total {pesos(total)}.
      </p>
      <ul className="summary">
        {cart.map((line) => {
          const product = products.find((item) => item.code === line.code);
          if (!product) return null;
          return (
            <li key={line.code}>
              <span>
                <span className="code-chip">{line.code}</span> {product.name} <span className="summary-qty">x {line.qty}</span>
              </span>
              <strong>{pesos(unitPrice(product) * line.qty)}</strong>
            </li>
          );
        })}
        <li className="summary-total">
          <span>Total</span>
          <strong>{pesos(total)}</strong>
        </li>
      </ul>
      <form className="stack" onSubmit={onSubmit}>
        <label>
          Nombre
          <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} required />
        </label>
        <label>
          Teléfono
          <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" required />
        </label>
        <label>
          Zona
          <select value={zone} onChange={(event) => setZone(event.target.value)}>
            {ZONES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>Pago</legend>
          <label className="check">
            <input
              type="radio"
              name="pago"
              checked={paymentMode === "contado"}
              onChange={() => setPaymentMode("contado")}
            />
            Contado
          </label>
          <label className="check">
            <input
              type="radio"
              name="pago"
              checked={paymentMode === "cuenta_corriente"}
              disabled={!accountCanCredit}
              onChange={() => setPaymentMode("cuenta_corriente")}
            />
            Cuenta corriente{accountCanCredit ? "" : " (solo revendedor habilitado)"}
          </label>
        </fieldset>
        <label>
          Nota para el pedido
          <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="btn" type="submit">
          {settings.whatsapp ? "Guardar y abrir WhatsApp" : "Guardar pedido"}
        </button>
      </form>
    </section>
  );
}
