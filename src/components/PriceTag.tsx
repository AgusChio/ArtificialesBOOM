import { pesos } from "../shop/format";
import { useShop } from "../shop/store";
import type { Product } from "../shop/types";

export function PriceTag({ product }: { product: Product }) {
  const { unitPrice, priceList, session } = useShop();
  const amount = unitPrice(product);
  const other =
    session?.role === "admin"
      ? priceList === "mayorista"
        ? product.retailPrice
        : product.wholesalePrice
      : null;

  return (
    <span className="price">
      <span>{pesos(amount)}</span>
      {session?.role === "admin" && other != null && (
        <span className="price-note">
          {priceList === "mayorista" ? "Mostrador" : "Revendedor"} {pesos(other)}
        </span>
      )}
    </span>
  );
}
