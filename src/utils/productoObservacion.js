// Qué producto tiene una observación. Hay tres casos:
//  - Producto de la factura: `posicion` (y código, nombre, cantidad facturada y precio de esa línea).
//  - Producto que NO está en la factura (solo Sobrante): `producto_no_facturado` con el nombre que
//    escribió el transportista; sin posición, código, cantidad facturada ni precio.
//  - Toda la factura (rechazo total): sin producto.

export const TEXTO_NO_FACTURADO = "No facturado";
export const TEXTO_TODA_LA_FACTURA = "Toda la factura";

export function esNoFacturado(o) {
  return Boolean(o) && o.producto_no_facturado != null && String(o.producto_no_facturado).trim() !== "";
}

// ¿La observación es de un producto (de la factura o no facturado)? Si no, es de toda la factura.
export function tieneProducto(o) {
  return Boolean(o) && (o.posicion != null || esNoFacturado(o));
}

// Nombre del producto para mostrar ("Toda la factura" si no hay producto).
export function nombreProducto(o) {
  if (esNoFacturado(o)) return String(o.producto_no_facturado).trim();
  if (o?.posicion != null || o?.codigo_producto) return o.nombre_producto ?? TEXTO_TODA_LA_FACTURA;
  return TEXTO_TODA_LA_FACTURA;
}

// Código del producto: el de la factura, "No facturado" o null si es de toda la factura.
export function codigoProducto(o) {
  if (esNoFacturado(o)) return TEXTO_NO_FACTURADO;
  return o?.codigo_producto ?? null;
}
