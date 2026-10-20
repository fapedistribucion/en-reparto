import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { cargarDetalle } from "../compartido/cargaDetalle";
import ConfirmModal from "../compartido/ConfirmModal";
import { etiquetaMotivo } from "../utils/etiquetasMotivo";

// SAC aprueba un ticket que todavía no tiene número (estado POR_APROBAR: casos No logísticos y
// Faltante). Flujo: el transportista llamó a SAC → SAC contacta al vendedor → por cada observación
// No logística elige si el vendedor respondió → recién ahí se habilita "Aprobar". Un ticket solo
// con Faltante no tiene nada que confirmar, así que se puede aprobar de inmediato.
// La aprobación la hace la función aprobar_ticket() en la base (genera el número y guarda la
// respuesta del vendedor de cada observación en una sola operación).
export default function AprobarTicketSAC({ ticket, onAprobado }) {
  const [pendientes, setPendientes] = useState(null); // observaciones No logísticas por confirmar
  const [respuestas, setRespuestas] = useState({}); // { [observacion_id]: "CONTESTO" | "NO_CONTESTO" }
  const [confirmando, setConfirmando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;
    cargarDetalle(ticket.id)
      .then((d) => {
        if (cancelado) return;
        setPendientes(d.observaciones.filter((o) => o.categoria === "NO_LOGISTICO" && o.respuesta_vendedor == null));
      })
      .catch(() => {
        if (!cancelado) setError("No se pudieron cargar las observaciones.");
      });
    return () => {
      cancelado = true;
    };
  }, [ticket.id]);

  if (pendientes === null && !error) return <p className="dato-menor">Cargando...</p>;

  const faltanRespuestas = (pendientes ?? []).some((o) => !respuestas[o.id]);

  function cambiar(id, valor) {
    setRespuestas((r) => ({ ...r, [id]: valor }));
  }

  async function aprobar() {
    setConfirmando(false);
    setGuardando(true);
    setError("");
    const { data, error: errorRpc } = await supabase.rpc("aprobar_ticket", {
      p_ticket_id: ticket.id,
      p_respuestas: (pendientes ?? []).map((o) => ({ observacion_id: o.id, respuesta: respuestas[o.id] })),
    });
    setGuardando(false);
    if (errorRpc || !data?.codigo_ticket) {
      setError("No se pudo aprobar" + (errorRpc ? `: ${errorRpc.message}` : "."));
      return;
    }
    onAprobado(data.codigo_ticket);
  }

  return (
    <div className="accion-rol accion-aprobacion">
      <p className="panel-detalle-titulo-seccion">Aprobar ticket</p>
      <p className="dato-menor">
        Este reclamo todavía no tiene número de ticket. Al aprobarlo se genera el número y se asigna al caso en
        todas las vistas; luego se lo brindas al transportista.
      </p>

      {(pendientes ?? []).map((o) => (
        <div key={o.id} className="aprobacion-fila">
          <label htmlFor={`aprob-${o.id}`}>
            ¿Obtuvimos respuesta del vendedor? — {etiquetaMotivo(o.subcategoria)}
            {o.posicion != null ? ` (Pos. ${o.posicion} · ${o.codigo_producto})` : ""}
          </label>
          <select id={`aprob-${o.id}`} value={respuestas[o.id] ?? ""} onChange={(e) => cambiar(o.id, e.target.value)}>
            <option value="">Selecciona...</option>
            <option value="CONTESTO">Sí</option>
            <option value="NO_CONTESTO">No</option>
          </select>
        </div>
      ))}

      {error && <p className="mensaje-error">{error}</p>}

      <button
        type="button"
        onClick={() => setConfirmando(true)}
        disabled={guardando || faltanRespuestas || pendientes === null}
      >
        Aprobar
      </button>

      {confirmando && (
        <ConfirmModal
          mensaje="¿Aprobar el reclamo y generar el número de ticket?"
          onConfirmar={aprobar}
          onCancelar={() => setConfirmando(false)}
          cargando={guardando}
          textoConfirmar="Aprobar"
        />
      )}
    </div>
  );
}
