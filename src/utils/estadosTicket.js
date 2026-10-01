import { etiquetaAlcance } from "./alcance";

export const ETIQUETAS_ESTADO = {
  EN_RUTA: "EN RUTA",
  EN_LI: "EN LI",
  SOLUCIONADO: "SOLUCIONADO",
  ANULADO: "ANULADO",
};

// `respuesta_vendedor` (ticket_observaciones): NO_APLICA para Logístico (nunca
// requiere contactar al vendedor), CONTESTO/NO_CONTESTO para No logístico una vez
// que SAC lo valida, o null mientras sigue pendiente de validar.
export const ETIQUETAS_RESPUESTA_VENDEDOR = {
  NO_APLICA: "NO APLICA",
  CONTESTO: "CONTESTÓ",
  NO_CONTESTO: "NO CONTESTÓ",
};

export function etiquetaRespuestaVendedor(valor) {
  return ETIQUETAS_RESPUESTA_VENDEDOR[valor] ?? valor;
}

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

// Precio unitario del producto (ticket_observaciones.precio_unitario), formateado
// en soles. Puede venir null (reclamos de toda la factura, sin producto puntual).
export function formatearPrecio(valor) {
  if (valor == null) return "—";
  return `S/ ${Number(valor).toFixed(2)}`;
}

// Texto de la columna "Alcance" (usa los campos de la vista tickets_resumen).
// Ej.: "Rechazo total", "Rechazo parcial".
// La cantidad de productos observados ya no va aquí entre paréntesis: es la
// columna aparte "SKU observados" (ver textoSkuObservados más abajo).
// (El alcance REEDITADO ya no se usa: Local cerrado ahora es un motivo más
// dentro de Rechazo total, no un alcance forzado aparte.)
export function textoAlcance(ticket) {
  return etiquetaAlcance(ticket.alcance_reclamo);
}

// Cantidad de productos distintos observados en el ticket (columna "SKU
// observados"). Solo aplica a rechazo parcial: en rechazo total/reeditado la
// observación es de la factura completa, no de productos puntuales.
export function textoSkuObservados(ticket) {
  if (ticket.alcance_reclamo !== "RECHAZO_PARCIAL") return "—";
  return ticket.n_observaciones ?? "—";
}
