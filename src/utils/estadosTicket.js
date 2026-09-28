import { etiquetaMotivo } from "./etiquetasMotivo";
import { etiquetaAlcance } from "./alcance";

export const ETIQUETAS_ESTADO = {
  EN_RUTA: "En ruta",
  EN_LI: "En LI",
  SOLUCIONADO: "Solucionado",
  ANULADO: "Anulado",
};

export function formatearFecha(valor, conHora = false) {
  if (!valor) return "—";
  return new Date(valor).toLocaleString(
    "es-PE",
    conHora ? { dateStyle: "short", timeStyle: "short" } : { day: "2-digit", month: "2-digit", year: "numeric" }
  );
}

// Texto de la columna "Alcance" (usa los campos de la vista tickets_resumen).
// Ej.: "Rechazo total", "Rechazo parcial (3)", "Local cerrado - Reeditado"
export function textoAlcance(ticket) {
  if (ticket.alcance_reclamo === "REEDITADO") {
    return `${etiquetaMotivo(ticket.motivos?.[0] ?? "LOCAL_CERRADO")} - Reeditado`;
  }
  if (ticket.alcance_reclamo === "RECHAZO_PARCIAL") {
    return `Rechazo parcial (${ticket.n_observaciones ?? "?"})`;
  }
  return etiquetaAlcance(ticket.alcance_reclamo);
}
