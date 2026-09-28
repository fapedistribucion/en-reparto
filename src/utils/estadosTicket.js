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
// Ej.: "Rechazo total", "Rechazo parcial", "Local cerrado - Reeditado"
// La cantidad de productos observados ya no va aquí entre paréntesis: es la
// columna aparte "SKU observados" (ver textoSkuObservados más abajo).
export function textoAlcance(ticket) {
  if (ticket.alcance_reclamo === "REEDITADO") {
    return `${etiquetaMotivo(ticket.motivos?.[0] ?? "LOCAL_CERRADO")} - Reeditado`;
  }
  return etiquetaAlcance(ticket.alcance_reclamo);
}

// Cantidad de productos distintos observados en el ticket (columna "SKU
// observados"). Solo aplica a rechazo parcial: en rechazo total/reeditado la
// observación es de la factura completa, no de productos puntuales.
export function textoSkuObservados(ticket) {
  if (ticket.alcance_reclamo !== "RECHAZO_PARCIAL") return "—";
  return ticket.n_observaciones ?? "—";
}
