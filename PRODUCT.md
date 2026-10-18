# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: React + Convex, pedido explícito del cliente. Vite y TypeScript como armado del frontend. Esta sesión construye en código (la tienda es una herramienta de pedido, no un afiche suelto). No hay `buildPath` guardado: nadie eligió todavía entre comp y código como preferencia permanente.

## Users

- Persona particular en Salta que arma un pedido de pirotecnia para una fiesta y lo manda por WhatsApp.
- Revendedor (kiosco, puesto, reventa) que entra con acceso aprobado y ve otra lista de precios. Se lo segmenta por zona y por forma de pago: contado o cuenta corriente.
- Quien administra el negocio: carga productos, fotos, códigos y precios, marca disponibilidad a mano y aprueba revendedores.

## Product Purpose

Tienda propia de Pirotecnia Boom para vender fuegos artificiales sin depender de Tienda Nube, que restringe la publicidad de pirotecnia. El pedido se arma en la web y sale por WhatsApp para resolver la logística de temporada. Hay dos listas de precio. El panel lo usa el negocio sin un desarrollador.

## Positioning

El pedido se escribe con el código impreso en la caja. La lista minorista está abierta. La lista mayorista solo aparece con un acceso aprobado, y la cuenta corriente solo para quien quedó habilitado.

## Operating Context

Mostrador y reventa en Salta, con picos en Navidad, Año Nuevo, carnaval y egresados. El stock no se descuenta solo: alguien marca cada producto como disponible, a consultar o agotado. El cierre del pedido es un mensaje de WhatsApp con códigos, cantidades, zona y forma de pago.

## Capabilities and Constraints

- Catálogo con código, búsqueda, filtros, ficha y carrito.
- Precios minorista y mayorista distintos. El mayorista no se muestra a quien no tiene acceso.
- Pedido por WhatsApp. También queda guardado para el panel.
- Alta de revendedor con aprobación manual.
- Panel para productos, fotos, precios, disponibilidad, pedidos, accesos y el número de WhatsApp.
- Inventario manual. Un pedido no cambia el stock.
- Supuestos de arranque, a reemplazar antes de publicar: precios iniciales de carga, usuarios `admin` / `boom2026` y `revendedor` / `salta2026`.
- Sin confirmar: número de WhatsApp, dirección del local, horarios, razón social y CUIT.

## Brand Commitments

- Nombre: Pirotecnia Boom. El logo es la marca (nino de remera amarilla, short azul, palabra BOOM). Es el isotipo del negocio, no una invitación a que compren menores.
- Colores tomados del archivo del logo: negro, rojo `#FF1B1B`, amarillo `#FFD600`, azul `#1576C5`.
- Referencias de oficio, no de estética a copiar: Cienfuegos (importadora de fuegos y cotillón) y Distribuidora El Pampa. La tienda tiene que ser más clara para pedir.
- Venta y uso prohibidos a menores de 16 años, como figura en los empaques.

## Evidence on Hand

- Logo: `WhatsApp Image 2026-10-18 at 16.53.29.jpeg`.
- Fotos propias de producto: Impacto Austral, Batería F1190, Bola de humo, Volcán C8832, Volcán Vacano C8802, Estallo F9930, Estrellita F2257, Gorila Loco V11, Mariposa C7724, Pum Ball.
- No hay dirección, teléfono, listado de precios oficial, ni testimonios. No se inventan.

## Product Principles

- El código de la caja es el nombre con el que se pide.
- Dos listas, un solo catálogo. El precio depende de quién entró.
- Lo que no está marcado a mano no se da por existente.
- El pedido tiene que poder salir por WhatsApp en un paso.
- El panel lo tiene que poder usar quien vende, sin tocar código.

## Accessibility & Inclusion

Texto a 16px o más, contraste de lectura sobre negro, botones de al menos 44px, formularios con etiqueta visible y foco visible. El sitio se usa mucho desde el teléfono, en la calle o en el mostrador.
