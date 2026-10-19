import { FormEvent, useMemo, useState } from "react";
import { pesos } from "../shop/format";
import { emptyPromo, PROMO_KIND_LABEL, promoHint, quoteLine } from "../shop/pricing";
import { useShop } from "../shop/store";
import type { PriceList, Promo, PromoKind } from "../shop/types";

export function PromoDesk() {
  const { promos, products, savePromo, removePromo, priceList } = useShop();
  const [draft, setDraft] = useState<Promo | null>(null);
  const [error, setError] = useState("");
  const [productQuery, setProductQuery] = useState("");

  const preview = useMemo(() => {
    if (!draft) return null;
    const code = draft.allProducts ? products.find((item) => item.active)?.code : draft.productCodes[0];
    const product = products.find((item) => item.code === code);
    if (!product) return null;
    const list: PriceList = draft.lists.includes(priceList) ? priceList : draft.lists[0] ?? "minorista";
    const listPrice = list === "mayorista" ? (product.wholesalePrice ?? product.retailPrice) : product.retailPrice;
    const qty = draft.kind === "nxm" ? Math.max(draft.buyQty, draft.minQty) : Math.max(1, draft.minQty);
    const priced = quoteLine({
      listPrice,
      qty,
      code: product.code,
      promos: [{ ...draft, active: true, lists: [list], startsAt: "", endsAt: "" }],
      list,
    });
    return { product, qty, listPrice, lineTotal: priced.lineTotal };
  }, [draft, priceList, products]);

  const choices = useMemo(() => {
    const text = productQuery.trim().toLowerCase();
    return products.filter((product) => {
      if (!text) return true;
      return `${product.code} ${product.name}`.toLowerCase().includes(text);
    });
  }, [productQuery, products]);

  function patch(partial: Partial<Promo>) {
    setDraft((current) => (current ? { ...current, ...partial } : current));
  }

  function toggleList(list: PriceList) {
    if (!draft) return;
    const lists = draft.lists.includes(list) ? draft.lists.filter((item) => item !== list) : [...draft.lists, list];
    patch({ lists });
  }

  function toggleProduct(code: string) {
    if (!draft) return;
    const productCodes = draft.productCodes.includes(code)
      ? draft.productCodes.filter((item) => item !== code)
      : [...draft.productCodes, code];
    patch({ productCodes });
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    const result = await savePromo(draft);
    if (result) {
      setError(result);
      return;
    }
    setError("");
    setDraft(null);
  }

  return (
    <div className="admin-section">
      <div className="admin-toolbar">
        <p className="admin-promo-lead">
          Cada promo tiene nombre, etiqueta, fechas, lista de precio y productos. Si un código entra en más de una, se aplica la que deja el precio más bajo. No se acumulan.
        </p>
        <button
          className="btn admin-add-btn"
          type="button"
          onClick={() => {
            setError("");
            setProductQuery("");
            setDraft(emptyPromo());
          }}
        >
          Nueva promo
        </button>
      </div>

      {promos.length === 0 && !draft && <p>Todavía no hay promos. La primera puede ser un porcentaje, un monto, un precio de oferta o un 2x1.</p>}

      <ul className="admin-product-list">
        {promos.map((promo) => (
          <li key={promo.id} className={promo.active ? "admin-product-card" : "admin-product-card is-hidden"}>
            <div className="admin-product-body">
              <div className="admin-product-badges">
                <span className="promo-badge">{promo.badge || PROMO_KIND_LABEL[promo.kind]}</span>
                <span className="code-chip">{PROMO_KIND_LABEL[promo.kind]}</span>
                {!promo.active && <span className="admin-hidden-tag">Pausada</span>}
              </div>
              <h2>{promo.name}</h2>
              <p className="admin-product-meta">
                {promoHint(promo)}
                {promo.minQty > 1 ? ` · desde ${promo.minQty}` : ""}
                {" · "}
                {promo.lists.map((list) => (list === "mayorista" ? "Revendedor" : "Mostrador")).join(" y ") || "Sin lista"}
                {" · "}
                {promo.allProducts ? "Todo el catálogo" : `${promo.productCodes.length} productos`}
              </p>
              {(promo.startsAt || promo.endsAt) && (
                <p className="admin-product-meta">
                  {promo.startsAt || "Sin inicio"} → {promo.endsAt || "Sin fin"}
                </p>
              )}
            </div>
            <button
              className="btn btn-sm admin-edit-btn"
              type="button"
              onClick={() => {
                setError("");
                setDraft(promo);
              }}
            >
              Editar
            </button>
          </li>
        ))}
      </ul>

      {draft && (
        <form className="panel stack promo-editor" onSubmit={onSave}>
          <h2>{draft.id ? "Editar promo" : "Nueva promo"}</h2>
          <label>
            Nombre
            <input value={draft.name} onChange={(event) => patch({ name: event.target.value })} placeholder="2x1 volcanes de diciembre" required />
          </label>
          <label>
            Etiqueta que ve el cliente
            <input value={draft.badge} onChange={(event) => patch({ badge: event.target.value })} placeholder="2x1, −15% o Navidad" />
          </label>
          <label>
            Detalle
            <textarea value={draft.detail} onChange={(event) => patch({ detail: event.target.value })} placeholder="Cómo se explica la oferta en la tienda" />
          </label>
          <label className="check">
            <input type="checkbox" checked={draft.active} onChange={(event) => patch({ active: event.target.checked })} />
            Promo activa
          </label>
          <fieldset>
            <legend>Listas</legend>
            <label className="check">
              <input type="checkbox" checked={draft.lists.includes("minorista")} onChange={() => toggleList("minorista")} />
              Mostrador
            </label>
            <label className="check">
              <input type="checkbox" checked={draft.lists.includes("mayorista")} onChange={() => toggleList("mayorista")} />
              Revendedor
            </label>
          </fieldset>
          <label>
            Tipo de descuento
            <select value={draft.kind} onChange={(event) => patch({ kind: event.target.value as PromoKind })}>
              {(Object.keys(PROMO_KIND_LABEL) as PromoKind[]).map((kind) => (
                <option key={kind} value={kind}>
                  {PROMO_KIND_LABEL[kind]}
                </option>
              ))}
            </select>
          </label>
          {draft.kind === "percent" && (
            <label>
              Porcentaje
              <input type="number" min={1} max={100} value={draft.percent} onChange={(event) => patch({ percent: Number(event.target.value) })} />
            </label>
          )}
          {draft.kind === "amount" && (
            <label>
              Pesos de descuento por unidad
              <input type="number" min={1} step={1} value={draft.amount} onChange={(event) => patch({ amount: Number(event.target.value) })} />
            </label>
          )}
          {draft.kind === "price" && (
            <label>
              Precio de oferta por unidad
              <input type="number" min={0} step={1} value={draft.offerPrice} onChange={(event) => patch({ offerPrice: Number(event.target.value) })} />
            </label>
          )}
          {draft.kind === "nxm" && (
            <div className="filters">
              <label>
                Llevá
                <input type="number" min={2} step={1} value={draft.buyQty} onChange={(event) => patch({ buyQty: Number(event.target.value) })} />
              </label>
              <label>
                Pagá
                <input type="number" min={1} step={1} value={draft.payQty} onChange={(event) => patch({ payQty: Number(event.target.value) })} />
              </label>
            </div>
          )}
          <label>
            Mínimo de unidades para activarla
            <input type="number" min={1} step={1} value={draft.minQty} onChange={(event) => patch({ minQty: Number(event.target.value) })} />
          </label>
          <div className="filters">
            <label>
              Desde
              <input type="date" value={draft.startsAt} onChange={(event) => patch({ startsAt: event.target.value })} />
            </label>
            <label>
              Hasta
              <input type="date" value={draft.endsAt} onChange={(event) => patch({ endsAt: event.target.value })} />
            </label>
          </div>
          <label className="check">
            <input type="checkbox" checked={draft.allProducts} onChange={(event) => patch({ allProducts: event.target.checked })} />
            Aplica a todo el catálogo
          </label>
          {!draft.allProducts && (
            <fieldset>
              <legend>Productos</legend>
              <input
                type="search"
                value={productQuery}
                onChange={(event) => setProductQuery(event.target.value)}
                placeholder="Buscar código o nombre"
                aria-label="Buscar producto para la promo"
              />
              <div className="promo-products">
                {choices.map((product) => (
                  <label className="check" key={product.code}>
                    <input
                      type="checkbox"
                      checked={draft.productCodes.includes(product.code)}
                      onChange={() => toggleProduct(product.code)}
                    />
                    {product.code} {product.name}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {preview && (
            <p className="form-note">
              Ejemplo con {preview.product.code} x {preview.qty}: lista {pesos(preview.listPrice * preview.qty)}, con esta promo{" "}
              {pesos(preview.lineTotal)}.
            </p>
          )}
          {error && <p className="form-error">{error}</p>}
          <div className="filters">
            <button className="btn" type="submit">
              Guardar promo
            </button>
            <button className="chip" type="button" onClick={() => setDraft(null)}>
              Cancelar
            </button>
            {draft.id && (
              <button
                className="chip"
                type="button"
                onClick={async () => {
                  if (!window.confirm("¿Eliminar esta promo?")) return;
                  await removePromo(draft.id);
                  setDraft(null);
                }}
              >
                Eliminar
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
