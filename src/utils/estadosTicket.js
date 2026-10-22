import { etiquetaAlcance } from "./alcance";

export const ETIQUETAS_ESTADO = {
  POR_APROBAR: "POR APROBAR",
  EN_RUTA: "EN RUTA",
  EN_LI: "GESTION LI",
  SOLUCIONADO: "SOLUCIONADO",
  ANULADO: "ANULADO",
};

// Número de ticket para mostrar: los casos No logísticos y Faltante no tienen código hasta que
// SAC los aprueba (estado POR_APROBAR); mientras tanto se ve "Sin ticket" en todas las vistas.
export function textoCodigoTicket(ticket) {
  return ticket?.codigo_ticket ?? "Sin ticket";
}

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

// `entrega_transporte` (tickets): registra si la factura ya se devolvió al
// transporte, independiente del `estado` final del ticket (un ticket puede seguir
// "GESTION LI" aunque la factura ya se haya entregado, si falta la NC).
export const ETIQUETAS_ENTREGA_TRANSPORTE = {
  SI: "SÍ",
  NO_RETENCION: "NO (Retención)",
};

export function etiquetaEntregaTransporte(valor) {
  return ETIQUETAS_ENTREGA_TRANSPORTE[valor] ?? valor;
}

// `motivo_retencion` (tickets): solo aplica cuando entrega_transporte = NO_RETENCION.
export const ETIQUETAS_MOTIVO_RETENCION = {
  GESTION_INVENTARIO: "Gestión de inventario",
  NO_ASUME_COBRO_TRANSPORTE: "No asume cobro transporte",
};

export function etiquetaMotivoRetencion(valor) {
  return ETIQUETAS_MOTIVO_RETENCION[valor] ?? valor;
}

// Columna "Entrega a transporte": "—" mientras el ticket ni siquiera llegó a LI
// (fecha_entrega_li vacío, la acción no aplica todavía), "Pendiente" si ya llegó
// pero LI aún no registra la respuesta, o la etiqueta Sí/No (Retención).
export function textoEntregaTransporte(ticket) {
  if (!ticket?.fecha_entrega_li) return "—";
  if (!ticket.entrega_transporte) return "Pendiente";
  return etiquetaEntregaTransporte(ticket.entrega_transporte);
}

// Columna "Motivo retención": solo tiene valor cuando hubo retención.
export function textoMotivoRetencion(ticket) {
  return ticket?.motivo_retencion ? etiquetaMotivoRetencion(ticket.motivo_retencion) : "—";
}

// Columna "Nota de crédito" a nivel de ticket (vista "Por factura"): la NC es por producto, así que
// el ticket muestra las NC distintas que tenga y cuántos productos ya la tienen si faltan algunos.
// "Pendiente" mientras ningún producto tenga NC.
export function textoNotaCredito(ticket) {
  if (!ticket?.nota_credito) return "Pendiente";
  const total = ticket.n_observaciones ?? 0;
  const con = ticket.n_con_nc ?? total; // sin n_con_nc (vista antigua) se asume completo
  return total > 0 && con < total ? `${ticket.nota_credito} (${con} de ${total})` : ticket.nota_credito;
}

// Siempre DD/MM/AAAA (con hora opcional), sin depender del formato "corto" del
// navegador/locale (que puede dar año de 2 dígitos u otro orden según el dispositivo).
export function formatearFecha(valor, conHora = false) {
  if (!valor) return "—";
  // Una fecha sin hora ("2026-10-17", como fecha_factura) se lee como medianoche UTC y en Perú
  // (UTC-5) se mostraba un día antes. Se construye con la fecha local para que salga el día correcto.
  const soloFecha = typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor);
  const fecha = soloFecha ? new Date(`${valor}T00:00:00`) : new Date(valor);
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const anio = fecha.getFullYear();
  const base = `${dia}/${mes}/${anio}`;
  if (!conHora) return base;
  const hora = fecha.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  return `${base} ${hora}`;
}

// Fecha y hora "DD/MM/AAAA HH:MM" (24 horas), siempre en hora de Lima (UTC-5, sin horario de verano), igual
// que en el Excel exportado. Para columnas como "Fecha actualización de estado".
export function formatearFechaHora(valor) {
  if (!valor) return "—";
  const instante = new Date(valor).getTime();
  if (Number.isNaN(instante)) return "—";
  const f = new Date(instante - 5 * 60 * 60 * 1000);
  const dos = (n) => String(n).padStart(2, "0");
  return `${dos(f.getUTCDate())}/${dos(f.getUTCMonth() + 1)}/${f.getUTCFullYear()} ${dos(f.getUTCHours())}:${dos(f.getUTCMinutes())}`;
}

// Lead time de llegada a LI (viene calculado en la base, vista tickets_complemento):
//   DENTRO   = llegó a LI hasta su fecha límite
//   FUERA    = llegó después de la fecha límite, o todavía no llegó y la fecha límite ya pasó
//   EN_PLAZO = todavía no llegó, pero aún está dentro del plazo
//   vacío    = sin dato (anulado, sin región o sin fecha de factura): se muestra "—"
export const ETIQUETAS_LEAD_TIME = {
  DENTRO: "Dentro de fecha",
  FUERA: "Fuera de fecha",
  EN_PLAZO: "En plazo",
};

export function etiquetaLeadTime(valor) {
  return ETIQUETAS_LEAD_TIME[valor] ?? "—";
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
// observación es de la factura completa, no de productos puntuales. Sobrante
// (sin alcance) también registra productos, así que también cuenta.
export function textoSkuObservados(ticket) {
  const sinAlcance = ticket.alcance_reclamo == null;
  if (ticket.alcance_reclamo !== "RECHAZO_PARCIAL" && !sinAlcance) return "—";
  return ticket.n_observaciones ?? "—";
}
