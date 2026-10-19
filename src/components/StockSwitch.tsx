import { useShop } from "../shop/store";
import type { Product } from "../shop/types";

export function StockSwitch({ product }: { product: Product }) {
  const { session, saveProduct } = useShop();
  if (session?.role !== "admin") return null;

  const inStock = product.availability !== "agotado";

  return (
    <label className="stock-switch">
      <input
        type="checkbox"
        role="switch"
        checked={inStock}
        onChange={() => {
          void saveProduct({
            ...product,
            availability: inStock ? "agotado" : "disponible",
          });
        }}
        aria-label={inStock ? `Marcar ${product.code} sin stock` : `Volver a poner ${product.code} con stock`}
      />
      <span>{inStock ? "Con stock" : "Sin stock"}</span>
    </label>
  );
}
