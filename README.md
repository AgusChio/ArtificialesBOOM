# Pirotecnia Boom

Tienda de fuegos artificiales en Salta. Lista de mostrador abierta, lista de revendedor con acceso, y pedido por WhatsApp.

## Arrancar

```bash
npm install
npm run dev
```

La tienda abre en `http://localhost:5173` y guarda productos, pedidos y accesos en este navegador.

Panel: usuario `admin`, clave `boom2026`.
Revendedor de prueba: usuario `revendedor`, clave `salta2026`.

Los precios que vienen cargados son de arranque. Cambialos en el panel antes de publicar, y cargá el WhatsApp en Ajustes.

## Convex

```bash
npx convex dev
```

Eso crea el proyecto en Convex y el archivo `.env.local` con `VITE_CONVEX_URL`. Con esa variable, la tienda deja el guardado del navegador y usa las funciones de `convex/boom.ts`: catálogo, dos listas de precio, pedidos, accesos y fotos.

La primera vez, la base se llena sola con los mismos productos y usuarios de prueba.
