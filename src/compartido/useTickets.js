import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Carga los tickets desde la vista tickets_resumen (una fila por ticket, con el resumen de sus observaciones).
// RLS decide qué ve cada rol: el transportista solo lo suyo, SAC y LI todo.
// Los refrescos posteriores son silenciosos (no vuelven a mostrar "Cargando...").
export function useTickets() {
  const [tickets, setTickets] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const recargar = useCallback(async () => {
    const { data, error: errorConsulta } = await supabase
      .from("tickets_resumen")
      .select("*")
      .order("fecha_creacion", { ascending: false });

    if (errorConsulta) setError(errorConsulta.message);
    else setError("");
    setTickets(data ?? []);
    setCargando(false);
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { tickets, cargando, error, recargar };
}
