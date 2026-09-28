import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { etiquetaEvidencia } from "../utils/etiquetasEvidencia";
import { etiquetaMotivo } from "../utils/etiquetasMotivo";
import { ETIQUETAS_ESTADO, formatearFecha, textoAlcance } from "../utils/estadosTicket";

const SEGUNDOS_VIGENCIA_URL = 60 * 10; // 10 minutos, solo mientras el popup está abierto

function Galeria({ fotos, onAmpliar }) {
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
            <img src={a.urlVisible} alt={etiquetaEvidencia(a.tipo_evidencia)} />
          ) : (
            <span className="miniatura-adjunto-error">No disponible</span>
          )}
          <span className="miniatura-adjunto-etiqueta">{etiquetaEvidencia(a.tipo_evidencia)}</span>
        </button>
      ))}
    </div>
  );
}

// Badge de validación: distinto según si la observación es logística (no requiere
// llamada, "No aplica") o no logística (pendiente / contestó / no contestó el vendedor).
function BadgeValidacion({ observacion }) {
  if (observacion.categoria !== "NO_LOGISTICO") {
    return <span className="badge-no-aplica">No aplica</span>;
  }
  if (observacion.validado !== "VALIDADO") {
    return <span className="badge-pendiente">Pendiente de validar</span>;
  }
  return (
    <span className={observacion.obtuvo_respuesta ? "badge-validacion-ok" : "badge-validacion-no"}>
      {observacion.obtuvo_respuesta ? "Contestó" : "No contestó"}
    </span>
  );
}

// `acciones`: botones a nivel de ticket (anular, marcar llegada, NC...).
// `renderAccionObservacion(obs, recargar)`: controles bajo cada observación (validación de SAC).
// `soloObservacionId`: si se abrió desde la vista "Por producto", el modal entra en modo enfocado:
// solo esa observación, solo sus evidencias (+ la foto de factura completa), y sin repetir datos
// que ya se ven en la tabla. En este modo la consulta también pide solo esos datos puntuales
// (no toda la factura), para que cargue más rápido.
export default function TicketDetalle({ ticket, onCerrar, acciones, renderAccionObservacion, soloObservacionId }) {
  const [observaciones, setObservaciones] = useState([]);
  const [adjuntos, setAdjuntos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [version, setVersion] = useState(0);
  const [fotoAmpliada, setFotoAmpliada] = useState(null);

  const modoEnfocado = Boolean(soloObservacionId);

  useEffect(() => {
    let cancelado = false;

    async function cargarDetalle() {
      let obsQuery = supabase.from("ticket_observaciones").select("*").eq("ticket_id", ticket.id);
      let adjQuery = supabase.from("ticket_adjuntos").select("*").eq("ticket_id", ticket.id);

      // Modo enfocado: solo la observación puntual y sus evidencias (+ la foto de
      // factura completa, que no tiene observacion_id). Menos filas, menos fotos
      // que firmar, carga más rápido que traer todo el ticket para mostrar una sola.
      if (modoEnfocado) {
        obsQuery = obsQuery.eq("id", soloObservacionId);
        adjQuery = adjQuery.or(`observacion_id.eq.${soloObservacionId},observacion_id.is.null`);
      }

      const [{ data: obs }, { data: adj }] = await Promise.all([obsQuery.order("id"), adjQuery.order("id")]);

      // Bucket privado: cada foto necesita una URL firmada temporal (se piden todas en una sola llamada)
      const rutas = (adj ?? []).map((a) => a.url_storage);
      let firmadas = [];
      if (rutas.length > 0) {
        const { data } = await supabase.storage.from("evidencias").createSignedUrls(rutas, SEGUNDOS_VIGENCIA_URL);
        firmadas = data ?? [];
      }
      const urlPorRuta = new Map(firmadas.map((f) => [f.path, f.signedUrl]));

      if (!cancelado) {
        setObservaciones(obs ?? []);
        setAdjuntos((adj ?? []).map((a) => ({ ...a, urlVisible: urlPorRuta.get(a.url_storage) ?? null })));
        setCargando(false);
      }
    }

    cargarDetalle();
    return () => {
      cancelado = true;
    };
  }, [ticket.id, version, modoEnfocado, soloObservacionId]);

  const recargar = () => setVersion((v) => v + 1);
  const fotosFactura = adjuntos.filter((a) => a.observacion_id === null);
  const observacionesMostradas = modoEnfocado
    ? observaciones.filter((o) => o.id === soloObservacionId)
    : observaciones;
  const observacionEnfocada = modoEnfocado ? observacionesMostradas[0] : null;

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
            <div><span>Factura</span><strong>{ticket.factura}</strong></div>
            <div>
              <span>Producto</span>
              <strong>
                {observacionEnfocada.codigo_producto ? observacionEnfocada.nombre_producto : "Toda la factura"}
              </strong>
            </div>
            <div>
              <span>Cantidad observada</span>
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
                    <div className="obs-card-encabezado">
                      <strong>{etiquetaMotivo(o.subcategoria)}</strong>
                      <BadgeValidacion observacion={o} />
                    </div>

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

                    <Galeria fotos={adjuntos.filter((a) => a.observacion_id === o.id)} onAmpliar={setFotoAmpliada} />

                    {renderAccionObservacion?.(o, recargar)}
                  </div>
                );
              })}
            </div>

            {fotosFactura.length > 0 && (
              <div className="panel-detalle-seccion">
                <p className="panel-detalle-titulo-seccion">Foto de la factura</p>
                <Galeria fotos={fotosFactura} onAmpliar={setFotoAmpliada} />
              </div>
            )}
          </>
        )}

        {acciones && <div className="panel-detalle-acciones">{acciones}</div>}

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
