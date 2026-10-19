import { Link } from "react-router-dom";
import { PriceTag } from "../components/PriceTag";
import { assetUrl, pesos, whatsappLink } from "../shop/format";
import { formatCartLine } from "../shop/pricing";
import { useShop } from "../shop/store";
import { AVAILABILITY_LABEL } from "../shop/types";

export function Checkout() {
  const { cart, products, cartCount, cartTotal, settings, quote, setQty, remove, clearCart } = useShop();

  if (cart.length === 0) {
    return (
      <section className="narrow">
        <h1>El carrito está vacío</h1>
        <p>Sumá códigos desde el catálogo y volvé para mandar el pedido por WhatsApp.</p>
        <Link className="btn" to="/catalogo">
          Ir al catálogo
        </Link>
      </section>
    );
  }

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

  return (
    <section className="narrow">
      <h1>Tu carrito</h1>
      <p className="statement">
        {cartCount} {cartCount === 1 ? "ítem" : "ítems"} · Total {pesos(cartTotal)}
      </p>
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
      <div className="drawer-foot">
        <p className="drawer-total">
          <span>Total ({cartCount} {cartCount === 1 ? "ítem" : "ítems"})</span>
          <strong>{pesos(cartTotal)}</strong>
        </p>
        <a className="btn btn-block" href={directWaUrl} target="_blank" rel="noreferrer">
          Enviar pedido por WhatsApp
        </a>
        <button className="text-button" type="button" onClick={clearCart}>
          Vaciar carrito
        </button>
      </div>
    </section>
  );
}
