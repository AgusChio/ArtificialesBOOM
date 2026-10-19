import { pesos } from "../shop/format";
import { defaultBadge } from "../shop/pricing";
import { useShop } from "../shop/store";
import type { Product } from "../shop/types";

export function PriceTag({ product, qty = 1 }: { product: Product; qty?: number }) {
  const { quote, priceList, session } = useShop();
  const priced = quote(product, qty);
  const listTotal = priced.listPrice * qty;
  const savings = priced.lineTotal < listTotal;
  const shown = priced.promo ?? (!savings ? priced.announced : null);
  const badge = shown ? defaultBadge(shown) : "";
  const other =
    qty === 1 && session?.role === "admin"
      ? priceList === "mayorista"
        ? product.retailPrice
        : product.wholesalePrice
      : null;
  const fromQty =
    shown && !savings ? (shown.kind === "nxm" ? shown.buyQty : shown.minQty > 1 ? shown.minQty : 0) : 0;

  return (
    <span className="price">
      <span className="price-stack">
        {savings && <span className="price-old">{pesos(listTotal)}</span>}
        <span>{pesos(savings ? priced.lineTotal : listTotal)}</span>
      </span>
      {badge && <span className="promo-badge">{badge}</span>}
      {fromQty > 1 && <span className="price-note">desde {fromQty}</span>}
      {other != null && (
        <span className="price-note">
          {priceList === "mayorista" ? "Mostrador" : "Revendedor"} {pesos(other)}
        </span>
      )}
    </span>
  );
}
