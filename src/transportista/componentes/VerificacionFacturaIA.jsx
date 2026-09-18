import { useState } from "react";
import { convertirABase64 } from "../../utils/convertirABase64";

const MAX_INTENTOS = 3;

export default function VerificacionFacturaIA({ archivo, numeroFactura, onResultado }) {
  const [intentos, setIntentos] = useState(0);
  const [verificando, setVerificando] = useState(false);
  const [estado, setEstado] = useState("pendiente"); // pendiente | coincide | no_coincide | agotado
  const [mensajeError, setMensajeError] = useState("");

  const intentosAgotados = intentos >= MAX_INTENTOS;

  async function verificar() {
    setVerificando(true);
    setMensajeError("");

    try {
      const imagenBase64 = await convertirABase64(archivo);
      const respuesta = await fetch("/api/validar-factura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagenBase64, numeroFactura }),
      });
      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.error ?? "Error al verificar la factura.");
      }

      const nuevosIntentos = intentos + 1;
      setIntentos(nuevosIntentos);

      if (resultado.coincide) {
        setEstado("coincide");
        onResultado({ verificado: true, intentosAgotados: false });
      } else if (nuevosIntentos >= MAX_INTENTOS) {
        setEstado("agotado");
        onResultado({ verificado: false, intentosAgotados: true });
      } else {
        setEstado("no_coincide");
        onResultado({ verificado: false, intentosAgotados: false });
      }
    } catch (error) {
      setMensajeError(error.message);
    } finally {
      setVerificando(false);
    }
  }

  if (!archivo) return null;

  return (
    <div className="bloque-verificacion-ia">
      {estado === "coincide" && (
        <p className="verificacion-ok">✓ Factura verificada automáticamente.</p>
      )}

      {estado === "agotado" && (
        <p className="verificacion-pendiente">
          No se pudo verificar automáticamente tras {MAX_INTENTOS} intentos. El reclamo
          continuará, pero quedará marcado para revisión manual de SAC.
        </p>
      )}

      {(estado === "pendiente" || estado === "no_coincide") && (
        <>
          {estado === "no_coincide" && (
            <p className="mensaje-error">
              La foto no coincide con la factura digitada. Intenta con una foto más clara.
              ({intentos}/{MAX_INTENTOS} intentos)
            </p>
          )}
          {mensajeError && <p className="mensaje-error">{mensajeError}</p>}
          <button type="button" onClick={verificar} disabled={verificando || intentosAgotados}>
            {verificando ? "Verificando..." : "Verificar factura con IA"}
          </button>
        </>
      )}
    </div>
  );
}
