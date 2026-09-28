import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Círculo de usuario para el encabezado global: muestra la inicial del correo
// y, al hacer clic, despliega correo actual, cambiar contraseña y salir de la cuenta.
// `correo` y `onSalir` vienen del propio App (useAuth), para reutilizar exactamente
// la misma sesión y el mismo cierre de sesión que ya usa el resto de la app.
export default function MenuUsuario({ correo, onSalir }) {
  const [abierto, setAbierto] = useState(false);
  const [cambiandoClave, setCambiandoClave] = useState(false);
  const [nuevaClave, setNuevaClave] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);
  const contenedor = useRef(null);

  useEffect(() => {
    function cerrarAlTocarFuera(e) {
      if (contenedor.current && !contenedor.current.contains(e.target)) {
        setAbierto(false);
        setCambiandoClave(false);
        setMensaje("");
      }
    }
    document.addEventListener("pointerdown", cerrarAlTocarFuera);
    return () => document.removeEventListener("pointerdown", cerrarAlTocarFuera);
  }, []);

  async function guardarNuevaClave() {
    if (nuevaClave.trim().length < 6) {
      setMensaje("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setGuardando(true);
    setMensaje("");
    const { error } = await supabase.auth.updateUser({ password: nuevaClave });
    setGuardando(false);

    if (error) {
      setMensaje("No se pudo cambiar la contraseña: " + error.message);
      return;
    }
    setMensaje("Contraseña actualizada.");
    setNuevaClave("");
    setTimeout(() => {
      setCambiandoClave(false);
      setMensaje("");
      setAbierto(false);
    }, 1200);
  }

  const inicial = correo ? correo[0].toUpperCase() : "?";

  return (
    <div className="menu-usuario" ref={contenedor}>
      <button
        type="button"
        className="circulo-usuario"
        onClick={() => setAbierto((v) => !v)}
        aria-label="Cuenta"
        title={correo || "Cuenta"}
      >
        {inicial}
      </button>

      {abierto && (
        <div className="desplegable-usuario">
          <p className="desplegable-usuario-correo">{correo || "—"}</p>

          {!cambiandoClave ? (
            <>
              <button type="button" onClick={() => setCambiandoClave(true)}>
                Cambiar contraseña
              </button>
              <button type="button" onClick={onSalir} className="opcion-salir">
                Salir de la cuenta
              </button>
            </>
          ) : (
            <div className="bloque-cambiar-clave">
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Nueva contraseña"
                value={nuevaClave}
                onChange={(e) => setNuevaClave(e.target.value)}
              />
              {mensaje && <p className="dato-menor">{mensaje}</p>}
              <div className="bloque-cambiar-clave-acciones">
                <button type="button" onClick={guardarNuevaClave} disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCambiandoClave(false);
                    setMensaje("");
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
