import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useShop } from "../shop/store";
import { ZONES, type PaymentMode } from "../shop/types";

export function Wholesale() {
  const { session, login, logout, requestAccess } = useShop();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    business: "",
    phone: "",
    zone: ZONES[0] as string,
    paymentMode: "contado" as PaymentMode,
  });

  async function onLogin(event: FormEvent) {
    event.preventDefault();
    setError((await login(username, password)) ?? "");
  }

  async function onRequest(event: FormEvent) {
    event.preventDefault();
    const result = await requestAccess(form);
    if (result) {
      setError(result);
      return;
    }
    setError("");
    setSent(true);
  }

  if (session?.role === "mayorista") {
    return (
      <section className="split">
        <div className="panel panel-field">
          <h1>Lista revendedor</h1>
          <p className="statement">
            {session.business}, en {session.zone}.{" "}
            {session.paymentMode === "cuenta_corriente" ? "Podés pedir en cuenta corriente." : "El pago de esta cuenta es de contado."}
          </p>
          <Link className="btn" to="/catalogo">
            Ver precios mayoristas
          </Link>
        </div>
        <div className="panel">
          <p>Cuando termines, cerrá el acceso para que el mostrador no quede con tu lista.</p>
          <button className="btn" type="button" onClick={logout}>
            Cerrar acceso
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="split">
      <div className="panel panel-field">
        <h1>Pedir acceso</h1>
        <p>Para kioscos y reventa. El precio mayorista aparece cuando el acceso queda aprobado.</p>
        {sent ? (
          <p>Recibimos el pedido de acceso. Cuando esté aprobado, vas a poder entrar con ese usuario.</p>
        ) : (
          <form className="stack" onSubmit={onRequest}>
            <label>
              Nombre
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </label>
            <label>
              Negocio
              <input value={form.business} onChange={(event) => setForm({ ...form, business: event.target.value })} required />
            </label>
            <label>
              Teléfono
              <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required />
            </label>
            <label>
              Zona
              <select value={form.zone} onChange={(event) => setForm({ ...form, zone: event.target.value })}>
                {ZONES.map((zone) => (
                  <option key={zone}>{zone}</option>
                ))}
              </select>
            </label>
            <label>
              Pago que querés usar
              <select
                value={form.paymentMode}
                onChange={(event) => setForm({ ...form, paymentMode: event.target.value as PaymentMode })}
              >
                <option value="contado">Contado</option>
                <option value="cuenta_corriente">Cuenta corriente</option>
              </select>
            </label>
            <label>
              Usuario
              <input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required />
            </label>
            <label>
              Clave
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
              />
            </label>
            <button className="btn" type="submit">
              Enviar pedido de acceso
            </button>
          </form>
        )}
      </div>
      <div className="panel">
        <h2>Ya tengo acceso</h2>
        <form className="stack" onSubmit={onLogin}>
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
        <p>Para probar: usuario revendedor, clave salta2026.</p>
      </div>
    </section>
  );
}
