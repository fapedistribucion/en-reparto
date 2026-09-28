import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Carga todas las observaciones (nivel producto/bulto), una fila por observación.
// Se combinan en el panel con los tickets ya cargados por useTickets (mismo id),
// así se reutiliza el registro completo del ticket (con motivos, n_observaciones, etc.)
// en vez de traerlo dos veces.
export function useObservaciones() {
  const [observaciones, setObservaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const recargar = useCallback(async () => {
    const { data, error: errorConsulta } = await supabase
      .from("ticket_observaciones")
      .select("*")
      .order("id", { ascending: false });

    if (errorConsulta) setError(errorConsulta.message);
    else setError("");
    setObservaciones(data ?? []);
    setCargando(false);
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { observaciones, cargando, error, recargar };
}
