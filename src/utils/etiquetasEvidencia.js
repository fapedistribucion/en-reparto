export const ETIQUETAS_EVIDENCIA = {
  foto_factura: "Foto de la factura",
  foto_etiqueta_ban: "Foto de la etiqueta (BAN)",
  foto_4_lados_bulto: "Fotos de los 4 lados del bulto",
  foto_4_lados_caja: "Fotos de los 4 lados de la caja",
  foto_producto: "Foto del producto",
  foto_producto_fecha_vencimiento: "Foto del producto (fecha de vencimiento visible)",
  foto_producto_lote: "Foto del producto (lote visible)",
};

// Etiquetas que cambian según el motivo (solo Avería pide las 6 caras del bulto/caja,
// así que ahí "4 lados" dejaría de ser cierto). `subcategoria` = config_subcategorias.subcategoria.
const ETIQUETAS_EVIDENCIA_POR_MOTIVO = {
  AVERIA: {
    foto_4_lados_bulto: "Fotos de los 6 lados del bulto",
    foto_4_lados_caja: "Fotos de los 6 lados de la caja",
  },
};

export function etiquetaEvidencia(tipo, subcategoria) {
  return ETIQUETAS_EVIDENCIA_POR_MOTIVO[subcategoria]?.[tipo] ?? ETIQUETAS_EVIDENCIA[tipo] ?? tipo;
}

// Cantidad EXACTA de fotos que exige cada tipo de evidencia por defecto (ni más, ni menos),
// según lo definido en el instructivo de motivos. Los tipos que no aparecen acá piden 1 sola foto.
export const CANTIDAD_EVIDENCIA = {
  foto_4_lados_bulto: 4,
  foto_4_lados_caja: 4,
};

// Excepciones por motivo a la regla por defecto. Cada regla es { min, max }:
//   min === max -> cantidad exacta; min < max -> se puede subir entre min y max fotos.
// Avería: las fotos del bulto/caja pasan a 6 exactas (las 6 caras) y la foto del
// producto admite de 1 hasta 4. Los demás motivos siguen con la regla por defecto.
export const REGLAS_EVIDENCIA_POR_MOTIVO = {
  AVERIA: {
    foto_4_lados_bulto: { min: 6, max: 6 },
    foto_4_lados_caja: { min: 6, max: 6 },
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
