import { useMemo, useState } from "react";
import { pesos } from "../shop/format";
import { lineCharge, todayKey } from "../shop/pricing";
import { useShop } from "../shop/store";
import type { Order } from "../shop/types";

type Range = "hoy" | "mes" | "todo";

function monthKey(time: number) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Salta",
    year: "numeric",
    month: "2-digit",
  }).format(new Date(time));
}

function inRange(order: Order, range: Range) {
  if (range === "todo") return true;
  if (range === "hoy") return todayKey(new Date(order.createdAt)) === todayKey();
  return monthKey(order.createdAt) === monthKey(Date.now());
}

export function SalesDesk() {
  const { orders, setOrderStatus } = useShop();
  const [range, setRange] = useState<Range>("mes");

  const filtered = useMemo(() => orders.filter((order) => inRange(order, range)), [orders, range]);
  const collected = filtered.filter((order) => order.status === "cerrado");
  const pending = filtered.filter((order) => order.status !== "cerrado");
  const money = (list: Order[]) => list.reduce((sum, order) => sum + order.total, 0);

  const ranking = useMemo(() => {
    const rows = new Map<string, { code: string; name: string; qty: number; total: number }>();
    for (const order of filtered) {
      for (const line of order.lines) {
        const current = rows.get(line.code) ?? { code: line.code, name: line.name, qty: 0, total: 0 };
        current.qty += line.qty;
        current.total += lineCharge(line);
        rows.set(line.code, current);
      }
    }
    return [...rows.values()].sort((a, b) => b.total - a.total);
  }, [filtered]);

  return (
    <div className="admin-section">
      <div className="filter-row" role="group" aria-label="Período">
        {(
          [
            ["hoy", "Hoy"],
            ["mes", "Este mes"],
            ["todo", "Todo"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={range === value ? "chip is-on" : "chip"}
            aria-pressed={range === value}
            onClick={() => setRange(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="admin-kpis sales-kpis" aria-label="Resumen de ventas">
        <div className="admin-kpi">
          <span className="admin-kpi-label">Cobradas</span>
          <strong>{pesos(money(collected))}</strong>
        </div>
        <div className="admin-kpi">
          <span className="admin-kpi-label">Por cobrar</span>
          <strong>{pesos(money(pending))}</strong>
        </div>
        <div className="admin-kpi">
          <span className="admin-kpi-label">Pedidos</span>
          <strong>{filtered.length}</strong>
        </div>
        <div className="admin-kpi">
          <span className="admin-kpi-label">Unidades</span>
          <strong>{ranking.reduce((sum, row) => sum + row.qty, 0)}</strong>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <h2>Sin ventas en este período</h2>
          <p>Cada carrito que se manda por WhatsApp queda anotado acá. Cobrada es la que marcás como cerrada.</p>
        </div>
      ) : (
        <>
          <h2 className="sales-title">Qué se vendió</h2>
          <ul className="sales-rank">
            {ranking.map((row) => (
              <li key={row.code}>
                <span>
                  <strong>{row.code}</strong> {row.name}
                </span>
                <span>
                  {row.qty} u. · {pesos(row.total)}
                </span>
              </li>
            ))}
          </ul>

          <h2 className="sales-title">Pedidos</h2>
          <ul className="order-list">
            {filtered.map((order) => (
              <li key={order.id} className="admin-order-card">
                <div className="admin-order-head">
                  <div>
                    <span className="code-chip">{order.number}</span>
                    <h2>{pesos(order.total)}</h2>
                  </div>
                  <span className={`badge ${order.status === "cerrado" ? "badge-disponible" : "badge-consultar"}`}>
                    {order.status === "cerrado" ? "Cobrada" : "Por cobrar"}
                  </span>
                </div>
                <p className="admin-order-meta">
                  <strong>{order.customerName}</strong> · {order.phone} · {order.zone}
                </p>
                <p className="admin-order-meta">
                  {new Date(order.createdAt).toLocaleString("es-AR")} · {order.priceList === "mayorista" ? "Revendedor" : "Mostrador"}
                </p>
                <ul className="admin-order-lines">
                  {order.lines.map((line) => (
                    <li key={line.code}>
                      <span>
                        <strong>{line.code}</strong> {line.name} × {line.qty}
                      </span>
                      <span>{pesos(lineCharge(line))}</span>
                    </li>
                  ))}
                </ul>
                {order.status !== "cerrado" && (
                  <button className="btn btn-sm" type="button" onClick={() => setOrderStatus(order.id, "cerrado")}>
                    Marcar cobrada
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
