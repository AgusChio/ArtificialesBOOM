import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PriceTag } from "../components/PriceTag";
import { PromoStrip } from "../components/PromoStrip";
import { Reveal } from "../components/Reveal";
import { Toast, useFlash } from "../components/Toast";
import { assetUrl } from "../shop/format";
import { useShop } from "../shop/store";
import { AVAILABILITY_LABEL, type Product } from "../shop/types";

const VERBS = [
  {
    word: "Elegí",
    text: "Buscá el código que está impreso en la caja.",
    image: "/productos/bateria.png",
    alt: "Caja de batería F1190 con el código a la vista",
  },
  {
    word: "Anotá",
    text: "Sumá las cantidades. El total usa tu lista de precio.",
    image: "/productos/impacto-austral.png",
    alt: "Torta Impacto Austral de 260 tiros",
  },
  {
    word: "Mandá",
    text: "El pedido se abre en WhatsApp con los códigos, la zona y el pago.",
    image: "/productos/mariposa.png",
    alt: "Caja de mariposas C7724",
  },
];

export function Home() {
  const { products, add, settings, session } = useShop();
  const visibleProducts = useMemo(() => products.filter((product) => product.active), [products]);
  const pinItems = useMemo(
    () =>
      visibleProducts.filter((product) => product.pin != null).sort((a, b) => (a.pin ?? 0) - (b.pin ?? 0)),
    [visibleProducts],
  );
  const [index, setIndex] = useState(0);
  const [activeCode, setActiveCode] = useState("");
  const [typed, setTyped] = useState("");
  const [note, setNote] = useState("");
  const [flash, showFlash] = useFlash();
  const pinRef = useRef<HTMLElement>(null);
  const current = pinItems[Math.min(index, Math.max(pinItems.length - 1, 0))];
  const active = visibleProducts.find((product) => product.code === activeCode) ?? visibleProducts[0];
  const gorila = products.find((product) => product.code === "V11");

  useEffect(() => {
    if (!activeCode && visibleProducts[0]) setActiveCode(visibleProducts[0].code);
  }, [activeCode, visibleProducts]);

  useEffect(() => {
    const node = pinRef.current;
    if (!node || pinItems.length === 0) return;
    const onScroll = () => {
      const total = node.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const passed = Math.min(Math.max(-node.getBoundingClientRect().top, 0), total);
      const next = Math.min(pinItems.length - 1, Math.floor((passed / total) * pinItems.length));
      setIndex(next);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pinItems.length]);

  function scrollToPin(next: number) {
    const node = pinRef.current;
    if (!node) return;
    const total = node.offsetHeight - window.innerHeight;
    const top = node.offsetTop + (total * next) / pinItems.length + 4;
    window.scrollTo({ top, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  function findTyped(value: string) {
    const query = value.trim().toLowerCase();
    if (!query) return undefined;
    return (
      visibleProducts.find((product) => product.code.toLowerCase() === query) ??
      visibleProducts.find((product) => product.name.toLowerCase().includes(query))
    );
  }

  function onCode(event: FormEvent) {
    event.preventDefault();
    const found = findTyped(typed);
    if (!found) {
      setNote("Ese código no está en la lista.");
      return;
    }
    setNote(`${found.code} ${found.name}`);
    setActiveCode(found.code);
    const pinIndex = pinItems.findIndex((product) => product.code === found.code);
    if (pinIndex >= 0) {
      setIndex(pinIndex);
      scrollToPin(pinIndex);
      return;
    }
    document.getElementById(`fila-${found.code}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  function sumar(product: Product) {
    const error = add(product.code, 1);
    showFlash(error ?? `${product.code} se sumó al carrito.`);
  }

  return (
    <>
      <section
        className="pin"
        ref={pinRef}
        style={{ height: `${Math.max(pinItems.length, 1) * 100}vh` }}
        aria-label="Cajas"
      >
        {current && (
          <div className="pin-sticky">
            <h1>BOOM</h1>
            <div className="pin-frame">
              <div className="pin-glow" aria-hidden="true" />
              <img key={current.code} src={assetUrl(current.image)} alt={`${current.code} ${current.name}, ${current.brand}`} />
              <p className="pin-caption">
                <span className="code-chip">{current.code}</span> {current.name}
              </p>
            </div>
            <div className="pin-copy">
              <p className="pin-lede">El pedido sale con el código de la caja.</p>
              <form onSubmit={onCode} className="code-form">
                <label htmlFor="codigo-portada">Código de la caja</label>
                <div className="code-field">
                  <input
                    id="codigo-portada"
                    value={typed}
                    onChange={(event) => setTyped(event.target.value)}
                    placeholder="F1190"
                    autoCapitalize="characters"
                    autoComplete="off"
                  />
                  <button className="btn" type="submit">
                    Buscar
                  </button>
                </div>
              </form>
              {note && <p className="form-note">{note}</p>}
            </div>
            <div className="pin-side">
              <div className="pin-dots" role="group" aria-label="Elegir caja">
                {pinItems.map((product, i) => (
                  <button
                    key={product.code}
                    type="button"
                    className={i === index ? "is-on" : ""}
                    aria-current={i === index ? "true" : undefined}
                    aria-label={`Ver ${product.code} ${product.name}`}
                    onClick={() => {
                      setIndex(i);
                      scrollToPin(i);
                    }}
                  />
                ))}
              </div>
              <div className="pin-price">
                <PriceTag product={current} />
              </div>
              <button
                className="btn pin-action"
                type="button"
                disabled={current.availability === "agotado"}
                onClick={() => sumar(current)}
              >
                {current.availability === "agotado" ? "Agotado" : `Sumar ${current.code}`}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="sheet" id="lista">
        <div className="sheet-photo">
          {active && <img key={active.code} src={assetUrl(active.image)} alt={`${active.code} ${active.name}`} />}
        </div>
        <div>
          <Reveal>
            <h2>La lista</h2>
          </Reveal>
          <PromoStrip />
          <ul className="rows">
            {visibleProducts.map((product) => {
              const open = product.code === active?.code;
              return (
                <li key={product.code} id={`fila-${product.code}`} className={open ? "is-open" : ""}>
                  <button
                    type="button"
                    className="row-hit"
                    aria-expanded={open}
                    onClick={() => setActiveCode(product.code)}
                  >
                    <span>
                      <span className="row-code">{product.code}</span> {product.name}
                    </span>
                    <PriceTag product={product} />
                  </button>
                  {open && (
                    <div className="row-body">
                      <p>
                        {product.summary} {product.unit}.{" "}
                        <span className={`badge badge-${product.availability}`}>
                          {AVAILABILITY_LABEL[product.availability]}
                        </span>
                        {product.minWholesale > 1 && session?.role === "mayorista"
                          ? ` Mínimo revendedor: ${product.minWholesale}.`
                          : ""}
                      </p>
                      <div className="row-actions">
                        <button
                          className="btn"
                          type="button"
                          disabled={product.availability === "agotado"}
                          onClick={() => sumar(product)}
                        >
                          {product.availability === "agotado" ? "Agotado" : "Sumar"}
                        </button>
                        <Link className="link-arrow" to={`/producto/${product.code}`}>
                          Ver la caja
                        </Link>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {gorila && gorila.active && (
        <section className="showcase">
          <img src={assetUrl(gorila.image)} alt="Primer plano de la caja Gorila Loco" />
          <article className="showcase-card">
            <p className="code-line">{gorila.code}</p>
            <h2>{gorila.name}</h2>
            <p>{gorila.summary || gorila.unit}</p>
            <PriceTag product={gorila} />
            <button
              className="btn btn-block"
              type="button"
              disabled={gorila.availability === "agotado"}
              onClick={() => sumar(gorila)}
            >
              {gorila.availability === "agotado" ? "Agotado" : `Sumar ${gorila.code}`}
            </button>
          </article>
        </section>
      )}

      <section className="steps" aria-label="Cómo se pide">
        {VERBS.map((verb, i) => (
          <Reveal className="verb" key={verb.word} delay={i * 90}>
            <img src={assetUrl(verb.image)} alt={verb.alt} loading="lazy" />
            <div className="verb-copy">
              <h2>{verb.word}</h2>
              <p>{verb.text}</p>
            </div>
          </Reveal>
        ))}
      </section>

      {active && (
        <section className="ticket-wrap">
          <article className="ticket">
            <div className="ticket-main">
              <h2>
                {active.code} {active.name}
              </h2>
              <div className="ticket-facts">
                <p>{active.unit}</p>
                <p>{active.brand}</p>
                <p>{AVAILABILITY_LABEL[active.availability]}</p>
              </div>
            </div>
            <div className="ticket-stub">
              <PriceTag product={active} />
              <button className="btn btn-block" type="button" disabled={active.availability === "agotado"} onClick={() => sumar(active)}>
                {active.availability === "agotado" ? "Agotado" : "Sumar"}
              </button>
            </div>
          </article>
          {session?.role !== "mayorista" && session?.role !== "admin" && (
            <p className="ticket-aside">
              La lista de revendedor se abre con acceso. <Link to="/mayorista">Pedir acceso</Link>
            </p>
          )}
        </section>
      )}

      <section className="visit">
        <img src={assetUrl("/productos/impacto-austral.png")} alt="Torta Impacto Austral, el tipo de caja que sale del mostrador" loading="lazy" />
        <article>
          <h2>Pedidos en Salta</h2>
          <p>{settings.city}</p>
          <p>El punto de retiro se confirma por WhatsApp.</p>
          <p>Diciembre, año nuevo, carnaval y egresados son la temporada fuerte.</p>
          <p>{settings.whatsapp ? `WhatsApp ${settings.whatsapp}` : "El WhatsApp se carga desde el panel."}</p>
          <Link className="btn btn-block" to="/pedido">
            Ver carrito
          </Link>
        </article>
      </section>

      <section className="faq">
        <div>
          <Reveal>
            <h2>Antes de comprar</h2>
          </Reveal>
          <p>Salta. El envío depende de la zona que dejes en el pedido.</p>
          <p>{settings.notice}</p>
          <div className="questions">
            <details>
              <summary>
                Puedo comprar si no soy revendedor
                <Chevron />
              </summary>
              <p>Sí. Podés armar tu carrito con los códigos y mandar el pedido directo por WhatsApp.</p>
            </details>
            <details>
              <summary>
                Cómo veo el precio mayorista
                <Chevron />
              </summary>
              <p>Con un acceso que se aprueba a mano. Hasta entonces ese precio no se muestra.</p>
            </details>
            <details>
              <summary>
                Hay cuenta corriente
                <Chevron />
              </summary>
              <p>Solo para revendedores habilitados. El resto paga de contado.</p>
            </details>
            <details>
              <summary>
                El stock baja solo
                <Chevron />
              </summary>
              <p>No. Cada producto se marca como disponible, a consultar o agotado.</p>
            </details>
            <details>
              <summary>
                Desde qué edad
                <Chevron />
              </summary>
              <p>Prohibida la venta y el uso a menores de 16 años.</p>
            </details>
          </div>
          <Link className="btn" to="/catalogo">
            Ir al catálogo
          </Link>
        </div>
        <div className="faq-photos">
          <img src={assetUrl("/productos/estrellita.png")} alt="Caja de estrellitas F2257" loading="lazy" />
          <img src={assetUrl("/productos/bola.png")} alt="Bolas de humo multicolor" loading="lazy" />
        </div>
      </section>

      <Link className="cta-band" to="/pedido">
        <span>Revisá tu carrito y mandalo por WhatsApp.</span>
        <Arrow />
        <strong>PEDIR</strong>
      </Link>
      <Toast flash={flash} />
    </>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="chevron">
      <path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="arrow">
      <path d="M8 40L40 8M18 8h22v22" fill="none" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}
