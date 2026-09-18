import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { etiquetaEvidencia } from "../utils/etiquetasEvidencia";

const SEGUNDOS_VIGENCIA_URL = 60 * 10; // 10 minutos, solo mientras el popup está abierto

function formatearFecha(valor) {
  if (!valor) return null;
  return new Date(valor).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });
}

const ETIQUETAS_ESTADO = {
  EN_RUTA: "En ruta",
  EN_LI: "En LI",
  SOLUCIONADO: "Solucionado",
  ANULADO: "Anulado",
};

export default function TicketDetalle({ ticket, onCerrar, acciones }) {
  const [observaciones, setObservaciones] = useState([]);
  const [adjuntos, setAdjuntos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [fotoAmpliada, setFotoAmpliada] = useState(null);

  useEffect(() => {
    let cancelado = false;

    async function cargarDetalle() {
      setCargando(true);

      const [{ data: obs }, { data: adj }] = await Promise.all([
        supabase.from("ticket_observaciones").select("*").eq("ticket_id", ticket.id),
        supabase.from("ticket_adjuntos").select("*").eq("ticket_id", ticket.id),
      ]);

      const adjuntosConUrl = await Promise.all(
        (adj ?? []).map(async (a) => {
          const { data: firmada } = await supabase.storage
            .from("evidencias")
            .createSignedUrl(a.url_storage, SEGUNDOS_VIGENCIA_URL);
          return { ...a, urlVisible: firmada?.signedUrl ?? null };
        })
      );

      if (!cancelado) {
        setObservaciones(obs ?? []);
        setAdjuntos(adjuntosConUrl);
        setCargando(false);
      }
    }

    cargarDetalle();
    return () => {
      cancelado = true;
    };
  }, [ticket.id]);

  return (
    <div className="fondo-modal" onClick={onCerrar}>
      <div className="panel-detalle" onClick={(e) => e.stopPropagation()}>
        <div className="panel-detalle-encabezado">
          <div>
            <p className="panel-detalle-codigo">{ticket.codigo_ticket}</p>
            <p className="panel-detalle-fecha">Creado {formatearFecha(ticket.fecha_creacion)}</p>
          </div>
          <span className={`badge-estado badge-estado-${ticket.estado?.toLowerCase()}`}>
            {ETIQUETAS_ESTADO[ticket.estado] ?? ticket.estado}
          </span>
        </div>

        <div className="panel-detalle-grid">
          <div><span>Factura</span><strong>{ticket.factura}</strong></div>
          <div><span>Pedido</span><strong>{ticket.pedido_entrega}</strong></div>
          <div><span>Cliente</span><strong>{ticket.cliente}</strong></div>
          <div><span>Transporte</span><strong>{ticket.empresa_transporte}</strong></div>
          <div><span>Categoría</span><strong>{ticket.categoria === "LOGISTICO" ? "Logístico" : "No logístico"}</strong></div>
          <div><span>Subcategoría</span><strong>{ticket.subcategoria}</strong></div>
        </div>

        {ticket.detalle_servicio && (
          <div className="panel-detalle-seccion">
            <p className="panel-detalle-titulo-seccion">Detalle de servicio</p>
            <p className="panel-detalle-texto-libre">{ticket.detalle_servicio}</p>
          </div>
        )}

        {cargando ? (
          <p className="panel-detalle-seccion">Cargando evidencia...</p>
        ) : (
          <>
            {observaciones.length > 0 && (
              <div className="panel-detalle-seccion">
                <p className="panel-detalle-titulo-seccion">Bultos observados</p>
                <table className="tabla-observaciones">
                  <thead>
                    <tr><th>N° bulto</th><th>Posición</th><th>Cantidad</th></tr>
                  </thead>
                  <tbody>
                    {observaciones.map((o) => (
                      <tr key={o.id}>
                        <td>{o.numero_bulto || "—"}</td>
                        <td>{o.posicion || "—"}</td>
                        <td>{o.cantidad ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {adjuntos.length > 0 && (
              <div className="panel-detalle-seccion">
                <p className="panel-detalle-titulo-seccion">Evidencia adjunta</p>
                <div className="galeria-adjuntos">
                  {adjuntos.map((a) => (
                    <button
                      type="button"
                      key={a.id}
                      className="miniatura-adjunto"
                      onClick={() => a.urlVisible && setFotoAmpliada(a.urlVisible)}
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
              </div>
            )}
          </>
        )}

        <div className="panel-detalle-seccion">
          <p className="panel-detalle-titulo-seccion">Trazabilidad</p>
          <table className="tabla-trazabilidad">
            <tbody>
              <tr>
                <td>Llegada a LI</td>
                <td>{formatearFecha(ticket.fecha_entrega_li) ?? "Pendiente"}</td>
              </tr>
              <tr>
                <td>Nota de crédito</td>
                <td>{ticket.nota_credito ?? "Pendiente"}</td>
              </tr>
              {ticket.categoria === "NO_LOGISTICO" && (
                <tr>
                  <td>Validado por SAC</td>
                  <td>{ticket.validado === "VALIDADO" ? "Sí" : "Pendiente"}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {acciones && <div className="panel-detalle-acciones">{acciones}</div>}

        <button type="button" className="boton-cerrar-panel" onClick={onCerrar}>
          Cerrar
        </button>
      </div>

      {fotoAmpliada && (
        <div className="fondo-modal fondo-modal-foto" onClick={() => setFotoAmpliada(null)}>
          <img src={fotoAmpliada} alt="Evidencia ampliada" className="foto-ampliada" />
        </div>
      )}
    </div>
  );
}
