export const ETIQUETAS_ALCANCE = {
  RECHAZO_TOTAL: "Rechazo total",
  RECHAZO_PARCIAL: "Rechazo parcial",
};

export function etiquetaAlcance(alcance) {
  return ETIQUETAS_ALCANCE[alcance] ?? alcance ?? "—";
}

// Motivos que el transportista elige como una opción propia del formulario (junto a Rechazo total /
// parcial) y que NO llevan alcance: el ticket queda con alcance vacío y una sola observación con
// ese motivo y su evidencia. Para sumar otro caso parecido a futuro, basta agregarlo acá.
export const MOTIVOS_SIN_ALCANCE = ["SOBRANTE"];

export function esMotivoSinAlcance(subcategoria) {
  return MOTIVOS_SIN_ALCANCE.includes(subcategoria);
}
