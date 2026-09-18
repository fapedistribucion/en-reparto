export const ETIQUETAS_EVIDENCIA = {
  foto_factura: "Foto de la factura",
  foto_etiqueta_ban: "Foto de la etiqueta (BAN)",
  foto_4_lados_bulto: "Fotos de los 4 lados del bulto",
  foto_4_lados_caja: "Fotos de los 4 lados de la caja",
  foto_producto: "Foto del producto",
  foto_producto_fecha_vencimiento: "Foto del producto (fecha de vencimiento visible)",
  foto_producto_lote: "Foto del producto (lote visible)",
};

export function etiquetaEvidencia(tipo) {
  return ETIQUETAS_EVIDENCIA[tipo] ?? tipo;
}
