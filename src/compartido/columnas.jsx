import {
  ETIQUETAS_ESTADO,
  textoCodigoTicket,
  formatearFecha,
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

// Definición ÚNICA de las columnas de las tablas "Por factura" y "Por producto". De aquí salen las tres
// cosas que antes se escribían por separado y se desalineaban: lo que dibuja la tabla, el orden al hacer
// clic en el encabezado y las columnas del Excel exportado.
//
// Cada columna: { id, titulo, tipo, valor, render?, soloExcel? }
//   tipo     = "texto" | "numero" | "fecha" | "fechahora"  (decide el orden y el formato en Excel)
//   valor    = (fila) => dato crudo (lo que se ordena y se exporta)
//   render   = (fila) => lo que se ve en la celda (si falta, se muestra el valor según su tipo)
//   soloExcel = true: la columna va en el Excel pero no en la tabla

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
  };
}

// Vista "Por factura": una fila por ticket.
// Orden de columnas: ... Pedido, Región, Departamento, Centro de distribución, y el resto.
export function columnasTickets({ mostrarTransporte = false, mostrarSkuObservados = false } = {}) {
  const c = columnasDelTicket((t) => t);

  return [
    c.fecha_creacion,
    c.codigo_ticket,
    c.fecha_factura,
    ...(mostrarTransporte ? [c.transporte] : []),
    c.estado,
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
    c.entrega_transporte,
    c.motivo_retencion,
    { id: "nota_credito", titulo: "Nota de crédito", tipo: "texto", valor: (t) => textoNotaCredito(t) },
  ];
}

// Vista "Por producto": una fila por observación (la fila trae `ticket` ya combinado).
export function columnasObservaciones({ mostrarTransporte = true } = {}) {
  const c = columnasDelTicket((o) => o.ticket);

  return [
    c.fecha_creacion,
    c.codigo_ticket,
    c.fecha_factura,
    ...(mostrarTransporte ? [c.transporte] : []),
    c.estado,
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
    c.entrega_transporte,
    c.motivo_retencion,
    { id: "nota_credito", titulo: "Nota de Crédito", tipo: "texto", valor: (o) => o.nota_credito ?? "Pendiente" },
  ];
}

// Lo que se dibuja en una celda de la tabla: el `render` de la columna o, si no tiene, el valor con su formato.
export function contenidoCelda(columna, fila) {
  if (columna.render) return columna.render(fila);
  const v = columna.valor(fila);
  if (v === null || v === undefined || v === "") return "—";
  if (columna.tipo === "fecha" || columna.tipo === "fechahora") return formatearFecha(v, columna.tipo === "fechahora");
  return v;
}
