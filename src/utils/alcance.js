export const ETIQUETAS_ALCANCE = {
  RECHAZO_TOTAL: "Rechazo total",
  RECHAZO_PARCIAL: "Rechazo parcial",
  REEDITADO: "Reeditado",
};

export function etiquetaAlcance(alcance) {
  return ETIQUETAS_ALCANCE[alcance] ?? alcance ?? "—";
}
