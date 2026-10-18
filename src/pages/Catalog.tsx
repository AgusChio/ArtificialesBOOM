import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PriceTag } from "../components/PriceTag";
import { Toast, useFlash } from "../components/Toast";
import { assetUrl } from "../shop/format";
import { useShop } from "../shop/store";
import { AVAILABILITY_LABEL, type Availability } from "../shop/types";

type SortKey = "codigo" | "precio-asc" | "precio-desc" | "nombre";

export function Catalog() {
  const { products, add, unitPrice } = useShop();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [availability, setAvailability] = useState<"todas" | Availability>("todas");
  const [sort, setSort] = useState<SortKey>("codigo");
  const [flash, showFlash] = useFlash();

  const categories = useMemo(
    () => ["Todas", ...Array.from(new Set(products.filter((product) => product.active).map((product) => product.category)))],
    [products],
  );

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    const rows = products.filter((product) => {
      if (!product.active) return false;
      if (category !== "Todas" && product.category !== category) return false;
      if (availability !== "todas" && product.availability !== availability) return false;
      if (!text) return true;
      return [product.code, product.name, product.brand, product.category].join(" ").toLowerCase().includes(text);
    });
    rows.sort((a, b) => {
      if (sort === "nombre") return a.name.localeCompare(b.name, "es");
      if (sort === "precio-asc") return unitPrice(a) - unitPrice(b);
      if (sort === "precio-desc") return unitPrice(b) - unitPrice(a);
      return a.code.localeCompare(b.code, "es");
    });
    return rows;
  }, [products, query, category, availability, sort, unitPrice]);

  const filtered = query.trim() !== "" || category !== "Todas" || availability !== "todas";

  return (
    <section className="catalog">
      <header className="page-head">
        <h1>Catálogo</h1>
        <p className="lede">
          {visible.length} {visible.length === 1 ? "producto" : "productos"}
        </p>
      </header>
      <div className="toolbar">
        <form className="filters" onSubmit={(event) => event.preventDefault()} role="search">
          <label className="grow">
            Buscar por código o nombre
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="F1190 o gorila"
            />
          </label>
          <label>
            Orden
            <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
              <option value="codigo">Código</option>
              <option value="nombre">Nombre</option>
              <option value="precio-asc">Precio, menor primero</option>
              <option value="precio-desc">Precio, mayor primero</option>
            </select>
          </label>
        </form>
        <div className="filter-row" role="group" aria-label="Categoría">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={item === category}
              className={item === category ? "chip is-on" : "chip"}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="filter-row" role="group" aria-label="Disponibilidad">
          {(["todas", "disponible", "consultar", "agotado"] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={item === availability}
              className={item === availability ? "chip chip-quiet is-on" : "chip chip-quiet"}
              onClick={() => setAvailability(item)}
            >
              {item === "todas" ? "Todas" : AVAILABILITY_LABEL[item]}
            </button>
          ))}
        </div>
      </div>
      {visible.length === 0 ? (
        <div className="empty">
          <p>Ningún código coincide con esa búsqueda.</p>
          {filtered && (
            <button
              className="btn"
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("Todas");
                setAvailability("todas");
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <ul className="product-grid">
          {visible.map((product) => (
            <li key={product.code} className="product-card">
              <Link to={`/producto/${product.code}`} className="product-card-photo" tabIndex={-1} aria-hidden="true">
                <img src={assetUrl(product.image)} alt="" width="320" height="320" loading="lazy" />
              </Link>
              <span className={`badge badge-${product.availability}`}>{AVAILABILITY_LABEL[product.availability]}</span>
              <div className="product-card-body">
                <p className="code-line">{product.code}</p>
                <h2>
                  <Link to={`/producto/${product.code}`}>{product.name}</Link>
                </h2>
                <p className="product-card-meta">
                  {product.brand} · {product.unit}
                </p>
              </div>
              <div className="catalog-buy">
                <PriceTag product={product} />
                <button
                  className="btn btn-sm"
                  type="button"
                  disabled={product.availability === "agotado"}
                  onClick={() => showFlash(add(product.code, 1) ?? `${product.code} se sumó al carrito.`)}
                >
                  {product.availability === "agotado" ? "Agotado" : "Sumar"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Toast flash={flash} />
    </section>
  );
}
