import { useEffect } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import { Frame } from "./components/Frame";
import { Admin } from "./pages/Admin";
import { Catalog } from "./pages/Catalog";
import { Checkout } from "./pages/Checkout";
import { Home } from "./pages/Home";
import { Notice } from "./pages/Notice";
import { ProductPage } from "./pages/ProductPage";
import { Wholesale } from "./pages/Wholesale";

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <>
      <ScrollTop />
      <Frame>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalogo" element={<Catalog />} />
        <Route path="/producto/:code" element={<ProductPage />} />
        <Route path="/pedido" element={<Checkout />} />
        <Route path="/mayorista" element={<Wholesale />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/aviso" element={<Notice />} />
        <Route
          path="*"
          element={
            <section className="narrow">
              <h1>Esa página no está</h1>
              <Link className="btn" to="/">
                Volver al inicio
              </Link>
            </section>
          }
        />
      </Routes>
      </Frame>
    </>
  );
}
