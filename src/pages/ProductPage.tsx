import { Link, useParams } from "react-router-dom";
import { PriceTag } from "../components/PriceTag";
import { Toast, useFlash } from "../components/Toast";
import { assetUrl } from "../shop/format";
import { useShop } from "../shop/store";
import { AVAILABILITY_LABEL } from "../shop/types";

export function ProductPage() {
  const { code = "" } = useParams();
  const { products, add, session } = useShop();
  const product = products.find((item) => item.code.toLowerCase() === code.toLowerCase());
  const [flash, showFlash] = useFlash();

  if (!product) {
    return (
      <section className="narrow">
        <h1>Ese código no está</h1>
        <p>Revisá el número impreso en la caja o volvé al catálogo.</p>
        <Link className="btn" to="/catalogo">
          Ir al catálogo
        </Link>
      </section>
    );
  }

  return (
    <article className="product">
      <div className="product-photo">
        <img src={assetUrl(product.image)} alt={`${product.code} ${product.name}`} />
      </div>
      <div className="product-info">
        <Link className="back-link" to="/catalogo">
          Volver al catálogo
        </Link>
        <h1>{product.code}</h1>
        <p className="statement">{product.name}</p>
        <p className="product-meta">
          {product.brand} · {product.category} · {product.unit}
        </p>
        <span className={`badge badge-${product.availability}`}>{AVAILABILITY_LABEL[product.availability]}</span>
        <div className="product-price">
          <PriceTag product={product} />
        </div>
        {session?.role === "mayorista" && product.minWholesale > 1 && (
          <p>Mínimo en lista revendedor: {product.minWholesale}.</p>
        )}
        {product.detail && <p>{product.detail}</p>}
        {product.summary && <p className="product-summary">{product.summary}</p>}
        <button
          className="btn"
          type="button"
          disabled={product.availability === "agotado"}
          onClick={() => showFlash(add(product.code, 1) ?? `${product.code} entró en la comanda.`)}
        >
          {product.availability === "agotado" ? "Agotado" : "Sumar a la comanda"}
        </button>
      </div>
      <Toast flash={flash} />
    </article>
  );
}
