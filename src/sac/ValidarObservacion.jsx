import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import ConfirmModal from "../compartido/ConfirmModal";

// SAC valida una observación No Logística tras contactar al vendedor.
export default function ValidarObservacion({ observacion, onHecho }) {
  const [respuesta, setRespuesta] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [confirmando, setConfirmando] = useState(false);

  if (observacion.categoria !== "NO_LOGISTICO" || observacion.validado === "VALIDADO") return null;

  // El botón "Validar" pide confirmación con nuestro propio popup (ConfirmModal)
  // en vez de guardar directo; validar() hace el cambio recién cuando se confirma ahí.
  function pedirConfirmacion() {
    if (!respuesta) {
      setError("Indica si se obtuvo respuesta del vendedor.");
      return;
    }
    setError("");
    setConfirmando(true);
  }

  async function validar() {
    setConfirmando(false);
    setGuardando(true);
    setError("");
    const { data: sesion } = await supabase.auth.getUser();

    const { data, error: errorUpdate } = await supabase
      .from("ticket_observaciones")
      .update({
        validado: "VALIDADO",
        obtuvo_respuesta: respuesta === "si",
        usuario_validacion: sesion.user.id,
        fecha_validacion: new Date().toISOString(),
      })
      .eq("id", observacion.id)
      .select();

    setGuardando(false);

    if (errorUpdate || !data?.length) {
      setError("No se pudo validar" + (errorUpdate ? `: ${errorUpdate.message}` : "."));
      return;
    }
    onHecho();
  }

  return (
    <div className="accion-rol accion-observacion">
      <label htmlFor={`respuesta-${observacion.id}`}>¿Obtuvimos respuesta del vendedor?</label>
      <select id={`respuesta-${observacion.id}`} value={respuesta} onChange={(e) => setRespuesta(e.target.value)}>
        <option value="">Selecciona...</option>
        <option value="si">Sí</option>
        <option value="no">No</option>
      </select>
      {error && <p className="mensaje-error">{error}</p>}
      <button type="button" onClick={pedirConfirmacion} disabled={guardando}>
        Validar
      </button>

      {confirmando && (
        <ConfirmModal
          mensaje={`¿Confirmar que el vendedor ${respuesta === "si" ? "SÍ" : "NO"} respondió?`}
          onConfirmar={validar}
          onCancelar={() => setConfirmando(false)}
          cargando={guardando}
        />
      )}
    </div>
  );
}
