import { defaultBadge, promoHint, promoIsLive } from "../shop/pricing";
import { useShop } from "../shop/store";

export function PromoStrip() {
  const { promos, priceList } = useShop();
  const live = promos.filter((promo) => promoIsLive(promo, priceList));
  if (live.length === 0) return null;

  return (
    <ul className="promo-strip" aria-label="Ofertas vigentes">
      {live.map((promo) => (
        <li key={promo.id}>
          <span className="promo-badge">{defaultBadge(promo)}</span>
          <strong>{promo.name}</strong>
          <span>{promo.detail || promoHint(promo)}</span>
        </li>
      ))}
    </ul>
  );
}
