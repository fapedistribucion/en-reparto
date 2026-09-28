import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

// SAC valida una observación No Logística tras contactar al vendedor.
export default function ValidarObservacion({ observacion, onHecho }) {
  const [respuesta, setRespuesta] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  if (observacion.categoria !== "NO_LOGISTICO" || observacion.validado === "VALIDADO") return null;

  async function validar() {
    if (!respuesta) {
      setError("Indica si se obtuvo respuesta del vendedor.");
      return;
    }

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
      <button type="button" onClick={validar} disabled={guardando}>
        Validar
      </button>
    </div>
  );
}
