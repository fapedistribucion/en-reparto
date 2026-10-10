export const ETIQUETAS_EVIDENCIA = {
  foto_factura: "Foto de la factura",
  foto_etiqueta_ban: "Foto de la etiqueta (BAN)",
  // "bulto" y "caja" son lo mismo para el transportista: los dos tipos se muestran como
  // "6 lados del bulto" (los tipos internos no cambian para no romper tickets ya creados).
  foto_4_lados_bulto: "Fotos de los 6 lados del bulto",
  foto_4_lados_caja: "Fotos de los 6 lados del bulto",
  foto_producto: "Foto del producto",
  foto_producto_fecha_vencimiento: "Foto del producto (fecha de vencimiento visible)",
  foto_producto_lote: "Foto del producto (lote visible)",
};

// `subcategoria` se conserva por compatibilidad con quienes ya llaman a esta función:
// hoy la etiqueta es la misma para todos los motivos.
export function etiquetaEvidencia(tipo) {
  return ETIQUETAS_EVIDENCIA[tipo] ?? tipo;
}

// Cantidad EXACTA de fotos que exige cada tipo de evidencia por defecto (ni más, ni menos). Los tipos que no aparecen acá piden 1 sola foto.
export const CANTIDAD_EVIDENCIA = {
  foto_4_lados_bulto: 6,
  foto_4_lados_caja: 6,
};

// Excepciones por motivo a la regla por defecto. Cada regla es { min, max }:
//   min === max -> cantidad exacta; min < max -> se puede subir entre min y max fotos.
// Avería: la foto del producto admite de 1 hasta 4. Los demás motivos siguen con la regla por defecto
// (las fotos del bulto son siempre 6 exactas, en cualquier motivo).
export const REGLAS_EVIDENCIA_POR_MOTIVO = {
  AVERIA: {
    foto_producto: { min: 1, max: 4 },
  },
};

export function reglaEvidencia(tipo, subcategoria) {
  const porMotivo = REGLAS_EVIDENCIA_POR_MOTIVO[subcategoria]?.[tipo];
  if (porMotivo) return porMotivo;
  const n = CANTIDAD_EVIDENCIA[tipo] ?? 1;
  return { min: n, max: n };
}

// Máximo de fotos que admite el tipo (con 1 solo argumento devuelve la regla por defecto).
export function cantidadEvidencia(tipo, subcategoria) {
  return reglaEvidencia(tipo, subcategoria).max;
}
