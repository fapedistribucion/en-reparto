import { useEffect, useState } from "react";
import { cargarDetalle, leerDetalleEnCache } from "./cargaDetalle";
import { etiquetaEvidencia } from "../utils/etiquetasEvidencia";
import { etiquetaMotivo } from "../utils/etiquetasMotivo";
import { ETIQUETAS_ESTADO, formatearFecha, textoAlcance } from "../utils/estadosTicket";

function Galeria({ fotos, subcategoria, onAmpliar }) {
  if (fotos.length === 0) return null;
  return (
    <div className="galeria-adjuntos">
      {fotos.map((a) => (
        <button
          type="button"
          key={a.id}
          className="miniatura-adjunto"
          onClick={() => a.urlVisible && onAmpliar(a.urlVisible)}
        >
          {a.urlVisible ? (
            <img src={a.urlVisible} decoding="async" alt={etiquetaEvidencia(a.tipo_evidencia, subcategoria)} />
          ) : (
            <span className="miniatura-adjunto-error">No disponible</span>
          )}
          <span className="miniatura-adjunto-etiqueta">{etiquetaEvidencia(a.tipo_evidencia, subcategoria)}</span>
        </button>
      ))}
    </div>
  );
}

// `acciones`: botones a nivel de ticket (anular, marcar llegada, NC...). Puede ser un nodo o una
// función `(recargar) => nodo` (para acciones que cambian los datos del popup, como agregar producto).
// `renderAccionObservacion(obs, recargar)`: controles bajo cada observación (validación de SAC).
// `soloObservacionId`: si se abrió desde la vista "Por producto", el modal entra en modo enfocado:
// solo esa observación, solo sus evidencias (+ la foto de factura completa), y sin repetir datos
// que ya se ven en la tabla. En este modo la consulta también pide solo esos datos puntuales
// (no toda la factura), para que cargue más rápido.
export default function TicketDetalle({ ticket, onCerrar, acciones, renderAccionObservacion, soloObservacionId }) {
  // Si ese ticket ya se cargó/precargó (ver cargaDetalle.js) el popup se pinta al instante.
  const enCache = leerDetalleEnCache(ticket.id, soloObservacionId);
  const [observaciones, setObservaciones] = useState(enCache?.observaciones ?? []);
  const [adjuntos, setAdjuntos] = useState(enCache?.adjuntos ?? []);
  const [cargando, setCargando] = useState(!enCache);
  const [version, setVersion] = useState(0);
  const [fotoAmpliada, setFotoAmpliada] = useState(null);

  const modoEnfocado = Boolean(soloObservacionId);

  useEffect(() => {
    let cancelado = false;

    function aplicar(datos) {
      if (cancelado) return;
      setObservaciones(datos.observaciones);
      setAdjuntos(datos.adjuntos);
      setCargando(false);
    }

    // Se muestra lo que haya en caché y se refresca en segundo plano (version > 0 = acción
    // reciente, p. ej. validar una observación: se fuerza la consulta).
    const previo = leerDetalleEnCache(ticket.id, soloObservacionId);
    if (previo) aplicar(previo);

    cargarDetalle(ticket.id, soloObservacionId, { forzar: version > 0 })
      .then(aplicar)
      .catch(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [ticket.id, version, soloObservacionId]);

  const recargar = () => setVersion((v) => v + 1);
  const fotosFactura = adjuntos.filter((a) => a.observacion_id === null);
  const observacionesMostradas = modoEnfocado
    ? observaciones.filter((o) => o.id === soloObservacionId)
    : observaciones;
  const observacionEnfocada = modoEnfocado ? observacionesMostradas[0] : null;
  const contenidoAcciones = typeof acciones === "function" ? acciones(recargar) : acciones;

  return (
    <div className="fondo-modal" onClick={onCerrar}>
      <div className="panel-detalle" onClick={(e) => e.stopPropagation()}>
        <div className="panel-detalle-encabezado">
          <div>
            <p className="panel-detalle-codigo">{ticket.codigo_ticket}</p>
            <p className="panel-detalle-fecha">Creado {formatearFecha(ticket.fecha_creacion, true)}</p>
          </div>
          <span className={`badge-estado badge-estado-${ticket.estado?.toLowerCase()}`}>
            {ETIQUETAS_ESTADO[ticket.estado] ?? ticket.estado}
          </span>
        </div>

        {!modoEnfocado && (
          <div className="panel-detalle-grid">
            <div><span>Factura</span><strong>{ticket.factura}</strong></div>
            <div><span>Pedido</span><strong>{ticket.pedido_entrega}</strong></div>
            <div><span>Cliente</span><strong>{ticket.cliente}</strong></div>
            <div><span>Transporte</span><strong>{ticket.empresa_transporte}</strong></div>
            <div><span>Vendedor</span><strong>{ticket.vendedor ?? "—"}</strong></div>
            <div><span>Alcance</span><strong>{textoAlcance(ticket)}</strong></div>
          </div>
        )}

        {modoEnfocado && !cargando && observacionEnfocada && (
          <div className="panel-detalle-grid">
            <div>
              <span>Factura</span>
              <strong>{ticket.factura}</strong>
            </div>
            <div>
              <span>Cliente</span>
              <strong>{ticket.cliente}</strong>
            </div>
            <div>
              <span>Motivo</span>
              <strong>{etiquetaMotivo(observacionEnfocada.subcategoria)}</strong>
            </div>
            <div>
              <span>Cantidad reclamada</span>
              <strong>
                {observacionEnfocada.posicion != null
                  ? `${observacionEnfocada.cantidad_observada} de ${observacionEnfocada.cantidad_facturada}`
                  : "—"}
              </strong>
            </div>
          </div>
        )}

        {cargando ? (
          <p className="panel-detalle-seccion">Cargando detalle...</p>
        ) : (
          <>
            <div className="panel-detalle-seccion">
              {!modoEnfocado && <p className="panel-detalle-titulo-seccion">Observaciones</p>}
              {observacionesMostradas.map((o) => {
                return (
                  <div className="obs-card" key={o.id}>
                    {!modoEnfocado && (
                      <div className="obs-card-encabezado">
                        <strong>{etiquetaMotivo(o.subcategoria)}</strong>
                      </div>
                    )}

                    {!modoEnfocado &&
                      (o.posicion != null ? (
                        <>
                          <p className="obs-card-linea">
                            Pos. {o.posicion} · {o.codigo_producto} — {o.nombre_producto}
                          </p>
                          <p className="obs-card-linea">
                            Bulto: {o.numero_bulto} · Cantidad observada: {o.cantidad_observada} de{" "}
                            {o.cantidad_facturada}
                          </p>
                        </>
                      ) : (
                        <p className="dato-menor">Toda la factura</p>
                      ))}

                    {o.usuario_agregado_sac && (
                      <p className="etiqueta-agregado-sac">
                        Agregado por SAC
                        {o.fecha_agregado_sac ? ` · ${formatearFecha(o.fecha_agregado_sac, true)}` : ""}
                      </p>
                    )}

                    {/* Evidencias del producto + foto de la factura juntas, a la misma
                        altura, en una sola galería (sin separarlas en recuadros aparte). */}
                    <Galeria
                      fotos={[...adjuntos.filter((a) => a.observacion_id === o.id), ...fotosFactura]}
                      subcategoria={o.subcategoria}
                      onAmpliar={setFotoAmpliada}
                    />

                    {renderAccionObservacion?.(o, recargar)}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {contenidoAcciones && <div className="panel-detalle-acciones">{contenidoAcciones}</div>}

        <button type="button" className="boton-cerrar-panel" onClick={onCerrar}>
          Cerrar
        </button>
      </div>

      {fotoAmpliada && (
        <div
          className="fondo-modal fondo-modal-foto"
          onClick={(e) => {
            e.stopPropagation();
            setFotoAmpliada(null);
          }}
        >
          <img src={fotoAmpliada} alt="Evidencia ampliada" className="foto-ampliada" />
        </div>
      )}
    </div>
  );
}
