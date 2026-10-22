import { SIN_REGION } from "../config";
import { etiquetaMotivo } from "../utils/etiquetasMotivo";

// Filtros comunes de las vistas de tickets (SAC, LI, Liquidaciones y Seguimiento del transportista).
// `region`: una región, o SIN_REGION para los que no tienen. `motivo`: texto libre o elegido de la lista;
// solo se aplica en "Por producto" (el motivo es de cada observación, no del ticket).
export const FILTROS_VACIOS = {
  ticket: "",
  factura: "",
  pedido: "",
  transporte: "",
  estado: "",
  region: "",
  motivo: "",
  desde: "",
  hasta: "",
};

function coincideTexto(valor, filtro) {
  if (!filtro) return true;
  return String(valor ?? "")
    .toLowerCase()
    .includes(filtro.trim().toLowerCase());
}

// Sin tildes ni mayúsculas, para que "averia" encuentre "Avería".
function sinTildes(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function coincideFecha(fechaIso, desde, hasta) {
  if (!desde && !hasta) return true;
  if (!fechaIso) return false;
  const fecha = new Date(fechaIso);
  if (desde && fecha < new Date(`${desde}T00:00:00`)) return false;
  if (hasta && fecha > new Date(`${hasta}T23:59:59`)) return false;
  return true;
}

function coincideRegion(ticket, filtro) {
  if (!filtro) return true;
  if (filtro === SIN_REGION) return !ticket?.region;
  return ticket?.region === filtro;
}

function coincideTicket(t, filtros) {
  return (
    coincideTexto(t?.codigo_ticket, filtros.ticket) &&
    coincideTexto(t?.factura, filtros.factura) &&
    coincideTexto(t?.pedido_entrega, filtros.pedido) &&
    (!filtros.transporte || t?.empresa_transporte === filtros.transporte) &&
    (!filtros.estado || t?.estado === filtros.estado) &&
    coincideRegion(t, filtros.region) &&
    coincideFecha(t?.fecha_creacion, filtros.desde, filtros.hasta)
  );
}

export function filtrarTickets(tickets, filtros) {
  return tickets.filter((t) => coincideTicket(t, filtros));
}

export function filtrarObservaciones(observaciones, filtros) {
  const motivo = sinTildes(filtros.motivo);
  return observaciones.filter(
    (o) => coincideTicket(o.ticket, filtros) && (!motivo || sinTildes(etiquetaMotivo(o.subcategoria)).includes(motivo))
  );
}

// ¿Hay algún filtro aplicado? El de motivo solo cuenta en "Por producto", que es donde existe.
export function hayFiltros(filtros, pestana) {
  return Object.entries(filtros).some(([campo, valor]) => valor && !(campo === "motivo" && pestana !== "sku"));
}
