import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource/lilita-one/400.css";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import { App } from "./App";
import { ConvexGate } from "./shop/convex-shop";
import { LocalShop } from "./shop/store";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("No está el contenedor de la tienda.");

const convexUrl = import.meta.env.VITE_CONVEX_URL;
const shop = convexUrl ? (
  <ConvexGate url={convexUrl}>
    <App />
  </ConvexGate>
) : (
  <LocalShop>
    <App />
  </LocalShop>
);

createRoot(root).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>{shop}</BrowserRouter>
  </StrictMode>,
);
