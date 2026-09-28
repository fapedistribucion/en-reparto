import { etiquetaMotivo } from "./etiquetasMotivo";
import { etiquetaAlcance } from "./alcance";

export const ETIQUETAS_ESTADO = {
  EN_RUTA: "En ruta",
  EN_LI: "En LI",
  SOLUCIONADO: "Solucionado",
  ANULADO: "Anulado",
};

// Siempre DD/MM/AAAA (con hora opcional), sin depender del formato "corto" del
// navegador/locale (que puede dar año de 2 dígitos u otro orden según el dispositivo).
export function formatearFecha(valor, conHora = false) {
  if (!valor) return "—";
  const fecha = new Date(valor);
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const anio = fecha.getFullYear();
  const base = `${dia}/${mes}/${anio}`;
  if (!conHora) return base;
  const hora = fecha.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  return `${base} ${hora}`;
}

// Para columnas donde "vacío" significa que algo todavía no pasó (llegada a LI,
// nota de crédito): en vez de una raya, un texto explícito.
export function fechaOPendiente(valor) {
  return valor ? formatearFecha(valor) : "Pendiente";
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
