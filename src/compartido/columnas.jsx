import {
  ETIQUETAS_ESTADO,
  textoCodigoTicket,
  formatearFecha,
  formatearFechaHora,
  etiquetaLeadTime,
  fechaOPendiente,
  textoAlcance,
  textoSkuObservados,
  etiquetaRespuestaVendedor,
  formatearPrecio,
  textoEntregaTransporte,
  textoMotivoRetencion,
  textoNotaCredito,
} from "../utils/estadosTicket";
import { etiquetaMotivo } from "../utils/etiquetasMotivo";
import { IconoLapiz } from "./iconos";

// Definición ÚNICA de las columnas de las tablas "Por factura" y "Por producto". De aquí salen las tres
// cosas que antes se escribían por separado y se desalineaban: lo que dibuja la tabla, el orden al hacer
// clic en el encabezado y las columnas del Excel exportado.
//
// Cada columna: { id, titulo, tipo, valor, render?, soloExcel? }
//   tipo     = "texto" | "numero" | "fecha" | "fechahora"  (decide el orden y el formato en Excel)
//   valor    = (fila) => dato crudo (lo que se ordena y se exporta)
//   render   = (fila) => lo que se ve en la celda (si falta, se muestra el valor según su tipo)
//   soloExcel = true: la columna va en el Excel pero no en la tabla
//   envolver  = true: el título del encabezado puede ir en dos líneas (columnas con título muy largo)

const ETIQUETAS_CATEGORIA = {
  LOGISTICO: "Logístico",
  NO_LOGISTICO: "No logístico",
};

function badgeEstado(t) {
  if (!t?.estado) return "—";
  return <span className={`badge-estado badge-estado-${t.estado.toLowerCase()}`}>{ETIQUETAS_ESTADO[t.estado] ?? t.estado}</span>;
}

// Columnas que son del ticket. `ticketDe(fila)` entrega el ticket de la fila: en "Por factura" la fila ya
// es el ticket; en "Por producto" es el ticket de la observación (puede faltar).
function columnasDelTicket(ticketDe) {
  const de = (fn) => (fila) => {
    const t = ticketDe(fila);
    return t ? fn(t) : null;
  };

  return {
    fecha_creacion: { id: "fecha_creacion", titulo: "Fecha creación", tipo: "fecha", valor: de((t) => t.fecha_creacion) },
    codigo_ticket: { id: "codigo_ticket", titulo: "N° Ticket", tipo: "texto", valor: de((t) => textoCodigoTicket(t)) },
    fecha_factura: { id: "fecha_factura", titulo: "Fecha factura", tipo: "fecha", valor: de((t) => t.fecha_factura) },
    transporte: { id: "transporte", titulo: "Transporte", tipo: "texto", valor: de((t) => t.empresa_transporte) },
    estado: {
      id: "estado",
      titulo: "Estado",
      tipo: "texto",
      valor: de((t) => ETIQUETAS_ESTADO[t.estado] ?? t.estado),
      render: (fila) => badgeEstado(ticketDe(fila)),
    },
    fecha_estado: {
      id: "fecha_estado",
      titulo: "Fecha actualización de estado",
      envolver: true, // el título pasa a dos líneas para no ensanchar tanto la columna
      tipo: "fechahora",
      valor: de((t) => t.fecha_estado),
    },
    factura: { id: "factura", titulo: "Factura", tipo: "texto", valor: de((t) => t.factura) },
    pedido: { id: "pedido", titulo: "Pedido", tipo: "texto", valor: de((t) => t.pedido_entrega) },
    region: { id: "region", titulo: "Región", tipo: "texto", valor: de((t) => t.region ?? "Sin región") },
    departamento: { id: "departamento", titulo: "Departamento", tipo: "texto", valor: de((t) => t.departamento) },
    centro: { id: "centro", titulo: "Centro de distribución", tipo: "texto", valor: de((t) => t.centro_distribucion) },
    cliente: { id: "cliente", titulo: "Cliente", tipo: "texto", valor: de((t) => t.cliente) },
    llegada_li: {
      id: "llegada_li",
      titulo: "Fecha llegada LI",
      tipo: "fecha",
      valor: de((t) => t.fecha_entrega_li),
      render: (fila) => fechaOPendiente(ticketDe(fila)?.fecha_entrega_li),
    },
    fecha_limite_li: { id: "fecha_limite_li", titulo: "Fecha límite LI", tipo: "fecha", valor: de((t) => t.fecha_limite_li) },
    lead_time_li: {
      id: "lead_time_li",
      titulo: "Lead time LI",
      tipo: "texto",
      valor: de((t) => (t.lead_time_li ? etiquetaLeadTime(t.lead_time_li) : null)),
      render: (fila) => {
        const v = ticketDe(fila)?.lead_time_li;
        return v ? <span className={`badge-lead badge-lead-${v.toLowerCase()}`}>{etiquetaLeadTime(v)}</span> : "—";
      },
    },
    entrega_transporte: {
      id: "entrega_transporte",
      titulo: "Entrega a transporte",
      tipo: "texto",
      valor: (fila) => textoEntregaTransporte(ticketDe(fila)),
    },
    motivo_retencion: {
      id: "motivo_retencion",
      titulo: "Motivo retención",
      tipo: "texto",
      valor: (fila) => textoMotivoRetencion(ticketDe(fila)),
    },
    // Solo Faltante y No logístico pasan por aprobación; en los demás casos queda en blanco («—»).
    // La fecha de aprobación se guarda en la base pero no se muestra (por ahora es interna).
    aprobado_por: { id: "aprobado_por", titulo: "Aprobado por", tipo: "texto", valor: de((t) => t.aprobado_por) },
  };
}

// Vista "Por factura": una fila por ticket.
// Orden de columnas: ... Pedido, Región, Departamento, Centro de distribución, y el resto.
export function columnasTickets({ mostrarTransporte = false, mostrarSkuObservados = false, mostrarUsuarios = false } = {}) {
  const c = columnasDelTicket((t) => t);

  return [
    c.fecha_creacion,
    c.codigo_ticket,
    c.fecha_factura,
    ...(mostrarTransporte ? [c.transporte] : []),
    c.estado,
    c.fecha_estado,
    ...(mostrarUsuarios ? [c.aprobado_por] : []),
    c.factura,
    c.pedido,
    c.region,
    c.departamento,
    c.centro,
    { id: "alcance", titulo: "Alcance", tipo: "texto", valor: (t) => textoAlcance(t) },
    ...(mostrarSkuObservados
      ? [
          {
            id: "sku_observados",
            titulo: "SKU observados",
            tipo: "numero",
            valor: (t) => {
              const n = textoSkuObservados(t);
              return typeof n === "number" ? n : null;
            },
            render: (t) => textoSkuObservados(t),
          },
        ]
      : []),
    c.cliente,
    c.llegada_li,
    c.fecha_limite_li,
    c.lead_time_li,
    c.entrega_transporte,
    c.motivo_retencion,
    { id: "nota_credito", titulo: "Nota de crédito", tipo: "texto", valor: (t) => textoNotaCredito(t) },
    ...(mostrarUsuarios
      ? [
          { id: "nc_por", titulo: "NC por", tipo: "texto", valor: (t) => t.nc_por },
          { id: "fecha_nc", titulo: "Fecha NC", tipo: "fechahora", valor: (t) => t.fecha_nc },
        ]
      : []),
  ];
}

// Vista "Por producto": una fila por observación (la fila trae `ticket` ya combinado).
// `editarNC(observacion)` (opcional): si viene, la celda de la NC muestra un lápiz para corregirla
// (solo en productos que ya tienen NC y cuyo ticket sigue en GESTION LI o Solucionado).
export function columnasObservaciones({ mostrarTransporte = true, mostrarUsuarios = false, editarNC = null } = {}) {
  const c = columnasDelTicket((o) => o.ticket);

  return [
    c.fecha_creacion,
    c.codigo_ticket,
    c.fecha_factura,
    ...(mostrarTransporte ? [c.transporte] : []),
    c.estado,
    c.fecha_estado,
    ...(mostrarUsuarios ? [c.aprobado_por] : []),
    c.factura,
    c.pedido,
    c.region,
    c.departamento,
    c.centro,
    c.cliente,
    { id: "codigo_producto", titulo: "Cód. Producto", tipo: "texto", valor: (o) => o.codigo_producto },
    { id: "posicion", titulo: "Posición", tipo: "numero", valor: (o) => o.posicion },
    {
      id: "producto",
      titulo: "Producto",
      tipo: "texto",
      valor: (o) => (o.codigo_producto ? o.nombre_producto : "Toda la factura"),
    },
    {
      id: "precio",
      titulo: "Precio Unitario",
      tipo: "numero",
      valor: (o) => (o.codigo_producto && o.precio_unitario != null ? o.precio_unitario : null),
      render: (o) => (o.codigo_producto ? formatearPrecio(o.precio_unitario) : "—"),
    },
    {
      id: "motivo",
      titulo: "Motivo",
      tipo: "texto",
      valor: (o) => etiquetaMotivo(o.subcategoria),
      render: (o) => (
        <>
          {etiquetaMotivo(o.subcategoria)}
          {o.observacion && (
            <span className="dato-menor" title={o.observacion}>
              {" "}
              · {o.observacion}
            </span>
          )}
        </>
      ),
    },
    { id: "observacion", titulo: "Observación", tipo: "texto", valor: (o) => o.observacion, soloExcel: true },
    { id: "categoria", titulo: "Categoría", tipo: "texto", valor: (o) => ETIQUETAS_CATEGORIA[o.categoria] ?? o.categoria },
    {
      id: "respuesta_vendedor",
      titulo: "Respuesta vendedor",
      tipo: "texto",
      valor: (o) => (o.respuesta_vendedor ? etiquetaRespuestaVendedor(o.respuesta_vendedor) : null),
      render: (o) =>
        o.respuesta_vendedor ? (
          <span className={`badge-respuesta badge-respuesta-${o.respuesta_vendedor.toLowerCase()}`}>
            {etiquetaRespuestaVendedor(o.respuesta_vendedor)}
          </span>
        ) : (
          "—"
        ),
    },
    { id: "bulto", titulo: "Bulto", tipo: "texto", valor: (o) => o.numero_bulto },
    {
      id: "cant_reclamada",
      titulo: "Cant. Reclamada",
      tipo: "numero",
      valor: (o) => (o.posicion != null ? o.cantidad_observada : null),
    },
    {
      id: "cant_total",
      titulo: "Cant. Total",
      tipo: "numero",
      valor: (o) => (o.posicion != null ? o.cantidad_facturada : null),
    },
    c.llegada_li,
    c.fecha_limite_li,
    c.lead_time_li,
    c.entrega_transporte,
    c.motivo_retencion,
    {
      id: "nota_credito",
      titulo: "Nota de Crédito",
      tipo: "texto",
      valor: (o) => o.nota_credito ?? "Pendiente",
      render: (o) => {
        const editable = editarNC && o.nota_credito && ["EN_LI", "SOLUCIONADO"].includes(o.ticket?.estado);
        return (
          <>
            {o.nota_credito ?? "Pendiente"}
            {editable && (
              <button
                type="button"
                className="boton-icono boton-editar-nc"
                style={{ marginLeft: 6, padding: "2px 6px" }}
                onClick={() => editarNC(o)}
                title="Editar la Nota de Crédito de este producto"
                aria-label="Editar la Nota de Crédito de este producto"
              >
                <IconoLapiz size={14} />
              </button>
            )}
          </>
        );
      },
    },
    // En "Por producto" la NC es de cada línea: quién y cuándo la puso en ese producto.
    ...(mostrarUsuarios
      ? [
          { id: "nc_por", titulo: "NC por", tipo: "texto", valor: (o) => o.nc_por },
          { id: "fecha_nc", titulo: "Fecha NC", tipo: "fechahora", valor: (o) => o.fecha_nc },
        ]
      : []),
  ];
}

// Lo que se dibuja en una celda de la tabla: el `render` de la columna o, si no tiene, el valor con su formato.
export function contenidoCelda(columna, fila) {
  if (columna.render) return columna.render(fila);
  const v = columna.valor(fila);
  if (v === null || v === undefined || v === "") return "—";
  if (columna.tipo === "fechahora") return formatearFechaHora(v);
  if (columna.tipo === "fecha") return formatearFecha(v);
  return v;
}
