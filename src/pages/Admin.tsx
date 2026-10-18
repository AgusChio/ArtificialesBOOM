import { FormEvent, useState } from "react";
import { assetUrl, pesos, shrinkImage } from "../shop/format";
import { useShop } from "../shop/store";
import { AVAILABILITY_LABEL, type Availability, type Order, type PaymentMode, type Product } from "../shop/types";

const emptyProduct = (): Product => ({
  code: "",
  name: "",
  category: "Volcanes",
  brand: "",
  summary: "",
  detail: "",
  unit: "Unidad",
  retailPrice: 0,
  wholesalePrice: 0,
  minWholesale: 1,
  availability: "disponible",
  featured: false,
  pin: null,
  active: true,
  image: "/productos/gorila-loco.jpeg",
});

export function Admin() {
  const shop = useShop();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"productos" | "pedidos" | "accesos" | "ajustes">("productos");

  if (shop.session?.role !== "admin") {
    return (
      <section className="narrow">
        <h1>Panel</h1>
        <p>Entrá para cambiar precios, fotos, stock y accesos de revendedor.</p>
        <form
          className="stack"
          onSubmit={async (event) => {
            event.preventDefault();
            setError((await shop.login(username, password)) ?? "");
          }}
        >
          <label>
            Usuario
            <input value={username} onChange={(event) => setUsername(event.target.value)} required />
          </label>
          <label>
            Clave
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="btn" type="submit">
            Entrar
          </button>
        </form>
        <p>Primera entrada: admin / boom2026. Cambiala en Ajustes.</p>
      </section>
    );
  }

  return (
    <section className="admin">
      <div className="admin-head">
        <h1>Panel</h1>
        <button className="text-button" type="button" onClick={shop.logout}>
          Salir
        </button>
      </div>
      {!shop.settings.pricesConfirmed && (
        <p className="form-error">
          Los precios que ves se cargaron para arrancar la tienda. Actualizalos antes de pasar el sitio a tus clientes.
        </p>
      )}
      <div className="filter-row" role="tablist">
        {(
          [
            ["productos", "Productos"],
            ["pedidos", "Pedidos"],
            ["accesos", "Revendedores"],
            ["ajustes", "Ajustes"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} className={tab === id ? "chip is-on" : "chip"} type="button" onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      {tab === "productos" && <Products />}
      {tab === "pedidos" && <Orders />}
      {tab === "accesos" && <Accounts />}
      {tab === "ajustes" && <SettingsForm />}
    </section>
  );
}

function Products() {
  const { products, saveProduct, removeProduct } = useShop();
  const [draft, setDraft] = useState<Product | null>(null);
  const [original, setOriginal] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    const result = await saveProduct({
      ...draft,
      retailPrice: Number(draft.retailPrice),
      wholesalePrice: Number(draft.wholesalePrice ?? 0),
      minWholesale: Number(draft.minWholesale),
      pin: draft.pin ? Number(draft.pin) : null,
    });
    if (result) {
      setError(result);
      return;
    }
    if (original && original !== draft.code.trim().toUpperCase()) await removeProduct(original);
    setError("");
    setDraft(null);
    setOriginal(null);
  }

  return (
    <div className="admin-grid">
      <ul className="catalog-list">
        {products.map((product) => (
          <li key={product.code}>
            <img src={assetUrl(product.image)} alt="" width="72" height="72" />
            <div>
              <p className="code-line">
                {product.code} {!product.active && "· oculto"}
              </p>
              <h2>{product.name}</h2>
              <p>
                Mostrador {pesos(product.retailPrice)}
                {product.wholesalePrice != null ? ` · Revendedor ${pesos(product.wholesalePrice)}` : ""} ·{" "}
                {AVAILABILITY_LABEL[product.availability]}
              </p>
            </div>
            <button
              className="btn"
              type="button"
              onClick={() => {
                setDraft(product);
                setOriginal(product.code);
              }}
            >
              Editar
            </button>
          </li>
        ))}
      </ul>
      <div>
        <button
          className="btn"
          type="button"
          onClick={() => {
            setDraft(emptyProduct());
            setOriginal(null);
          }}
        >
          Nuevo producto
        </button>
        {draft && (
          <form className="stack panel editor" onSubmit={onSave}>
            <label>
              Código
              <input value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} required />
            </label>
            <label>
              Nombre
              <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required />
            </label>
            <label>
              Categoría
              <input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} required />
            </label>
            <label>
              Marca
              <input value={draft.brand} onChange={(event) => setDraft({ ...draft, brand: event.target.value })} />
            </label>
            <label>
              Presentación
              <input value={draft.unit} onChange={(event) => setDraft({ ...draft, unit: event.target.value })} />
            </label>
            <label>
              Resumen
              <input value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} />
            </label>
            <label>
              Detalle
              <textarea value={draft.detail} onChange={(event) => setDraft({ ...draft, detail: event.target.value })} rows={4} />
            </label>
            <label>
              Precio mostrador
              <input
                type="number"
                min={0}
                value={draft.retailPrice}
                onChange={(event) => setDraft({ ...draft, retailPrice: Number(event.target.value) })}
              />
            </label>
            <label>
              Precio revendedor
              <input
                type="number"
                min={0}
                value={draft.wholesalePrice ?? 0}
                onChange={(event) => setDraft({ ...draft, wholesalePrice: Number(event.target.value) })}
              />
            </label>
            <label>
              Mínimo revendedor
              <input
                type="number"
                min={1}
                value={draft.minWholesale}
                onChange={(event) => setDraft({ ...draft, minWholesale: Number(event.target.value) })}
              />
            </label>
            <label>
              Disponibilidad
              <select
                value={draft.availability}
                onChange={(event) => setDraft({ ...draft, availability: event.target.value as Availability })}
              >
                <option value="disponible">Disponible</option>
                <option value="consultar">A consultar</option>
                <option value="agotado">Agotado</option>
              </select>
            </label>
            <label>
              Orden en la portada (vacío si no va)
              <input
                type="number"
                min={1}
                value={draft.pin ?? ""}
                onChange={(event) => setDraft({ ...draft, pin: event.target.value ? Number(event.target.value) : null })}
              />
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(event) => setDraft({ ...draft, active: event.target.checked })}
              />
              Visible en la tienda
            </label>
            <label>
              Foto
              <input
                type="file"
                accept="image/*"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setDraft({ ...draft, image: await shrinkImage(file) });
                }}
              />
            </label>
            {draft.image && <img className="preview" src={assetUrl(draft.image)} alt="Vista previa del producto" />}
            {error && <p className="form-error">{error}</p>}
            <button className="btn" type="submit">
              Guardar producto
            </button>
            {original && (
              <button
                className="text-button"
                type="button"
                onClick={async () => {
                  if (window.confirm(`¿Quitar ${original} de la lista?`)) {
                    await removeProduct(original);
                    setDraft(null);
                  }
                }}
              >
                Quitar producto
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

function Orders() {
  const { orders, setOrderStatus } = useShop();
  if (orders.length === 0) return <p>Todavía no entró ningún pedido.</p>;
  return (
    <ul className="order-list">
      {orders.map((order) => (
        <li key={order.id}>
          <h2>
            {order.number} · {pesos(order.total)}
          </h2>
          <p>
            {new Date(order.createdAt).toLocaleString("es-AR")} · {order.customerName} · {order.phone}
          </p>
          <p>
            {order.zone} · {order.priceList} · {order.paymentMode === "contado" ? "Contado" : "Cuenta corriente"}
          </p>
          <ul>
            {order.lines.map((line) => (
              <li key={line.code}>
                {line.code} {line.name} x {line.qty}
              </li>
            ))}
          </ul>
          {order.note && <p>{order.note}</p>}
          <label>
            Estado
            <select value={order.status} onChange={(event) => setOrderStatus(order.id, event.target.value as Order["status"])}>
              <option value="nuevo">Nuevo</option>
              <option value="en_curso">En curso</option>
              <option value="cerrado">Cerrado</option>
            </select>
          </label>
        </li>
      ))}
    </ul>
  );
}

function Accounts() {
  const { accounts, setAccountStatus } = useShop();
  if (accounts.length === 0) return <p>No hay pedidos de acceso.</p>;
  return (
    <ul className="order-list">
      {accounts.map((account) => (
        <li key={account.id}>
          <h2>{account.business}</h2>
          <p>
            {account.name} · {account.phone} · {account.zone}
          </p>
          <p>Usuario {account.username}</p>
          <label>
            Pago habilitado
            <select
              value={account.paymentMode}
              onChange={(event) =>
                setAccountStatus(account.id, account.status, event.target.value as PaymentMode)
              }
            >
              <option value="contado">Contado</option>
              <option value="cuenta_corriente">Cuenta corriente</option>
            </select>
          </label>
          <div className="row-actions">
            <button className="btn" type="button" onClick={() => setAccountStatus(account.id, "aprobado", account.paymentMode)}>
              Aprobar
            </button>
            <button className="text-button" type="button" onClick={() => setAccountStatus(account.id, "rechazado", account.paymentMode)}>
              Rechazar
            </button>
            <span>{account.status}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function SettingsForm() {
  const { settings, saveSettings, changePassword } = useShop();
  const [draft, setDraft] = useState(settings);
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");

  return (
    <form
      className="stack narrow-form"
      onSubmit={async (event) => {
        event.preventDefault();
        await saveSettings(draft);
        setNote("Ajustes guardados.");
      }}
    >
      <label>
        WhatsApp, con código de área
        <input
          value={draft.whatsapp}
          onChange={(event) => setDraft({ ...draft, whatsapp: event.target.value })}
          placeholder="3870000000"
        />
      </label>
      <label>
        Ciudad
        <input value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })} />
      </label>
      <label>
        Aviso
        <textarea value={draft.notice} onChange={(event) => setDraft({ ...draft, notice: event.target.value })} rows={3} />
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={draft.pricesConfirmed}
          onChange={(event) => setDraft({ ...draft, pricesConfirmed: event.target.checked })}
        />
        Ya actualicé los precios de arranque
      </label>
      <button className="btn" type="submit">
        Guardar ajustes
      </button>
      <label>
        Nueva clave del panel
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>
      <button
        className="btn"
        type="button"
        onClick={async () => setNote((await changePassword(password)) ?? "Clave actualizada.")}
      >
        Cambiar clave
      </button>
      {note && <p className="form-note">{note}</p>}
    </form>
  );
}
