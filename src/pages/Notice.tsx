import { Link } from "react-router-dom";
import { useShop } from "../shop/store";

export function Notice() {
  const { settings } = useShop();
  return (
    <article className="narrow">
      <h1>Aviso</h1>
      <p className="statement">{settings.notice}</p>
      <p>
        Pirotecnia Boom vende fuegos artificiales en {settings.city}. El pedido se arma con el código de la caja y se
        confirma por WhatsApp. La lista del mostrador es pública. La lista de revendedor solo se ve con un acceso
        aprobado.
      </p>
      <p>
        La disponibilidad la marca el negocio a mano: disponible, a consultar o agotado. Un pedido no descuenta stock
        solo.
      </p>
      <p>
        La cuenta corriente existe únicamente para revendedores habilitados. El resto de los pedidos es de contado.
      </p>
      <p>Usá cada producto al aire libre, lejos de personas y de cosas que puedan prenderse, y seguí lo que dice la caja.</p>
      <p>
        <Link to="/catalogo">Volver al catálogo</Link>
      </p>
    </article>
  );
}
