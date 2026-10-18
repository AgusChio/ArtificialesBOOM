export type Availability = "disponible" | "consultar" | "agotado";
export type PriceList = "minorista" | "mayorista";
export type PaymentMode = "contado" | "cuenta_corriente";
export type AccountStatus = "pendiente" | "aprobado" | "rechazado";
export type OrderStatus = "nuevo" | "en_curso" | "cerrado";

export interface Product {
  code: string;
  name: string;
  category: string;
  brand: string;
  summary: string;
  detail: string;
  unit: string;
  retailPrice: number;
  wholesalePrice: number | null;
  minWholesale: number;
  availability: Availability;
  featured: boolean;
  pin: number | null;
  active: boolean;
  image: string;
}

export interface Account {
  id: string;
  username: string;
  passwordHash: string;
  role: "admin" | "mayorista";
  name: string;
  business: string;
  phone: string;
  zone: string;
  paymentMode: PaymentMode;
  status: AccountStatus;
}

export interface CartLine {
  code: string;
  qty: number;
}

export interface OrderLine {
  code: string;
  name: string;
  qty: number;
  unitPrice: number;
  availability: Availability;
}

export interface Order {
  id: string;
  number: string;
  createdAt: number;
  priceList: PriceList;
  customerName: string;
  phone: string;
  zone: string;
  paymentMode: PaymentMode;
  note: string;
  lines: OrderLine[];
  total: number;
  status: OrderStatus;
}

export interface Settings {
  whatsapp: string;
  city: string;
  notice: string;
  pricesConfirmed: boolean;
}

export interface Session {
  token: string;
  role: "admin" | "mayorista";
  name: string;
  business: string;
  zone: string;
  paymentMode: PaymentMode;
}

export interface CheckoutInput {
  customerName: string;
  phone: string;
  zone: string;
  paymentMode: PaymentMode;
  note: string;
}

export interface AccessRequest {
  username: string;
  password: string;
  name: string;
  business: string;
  phone: string;
  zone: string;
  paymentMode: PaymentMode;
}

export const ZONES = [
  "Salta Capital",
  "San Lorenzo",
  "Cerrillos",
  "Vaqueros",
  "La Caldera",
  "Rosario de Lerma",
  "Cafayate",
  "Metán",
  "Orán",
  "Tartagal",
  "Interior de Salta",
  "Otra provincia",
] as const;

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  disponible: "Disponible",
  consultar: "A consultar",
  agotado: "Agotado",
};
