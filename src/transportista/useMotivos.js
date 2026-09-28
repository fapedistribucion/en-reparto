import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { etiquetaMotivo } from "../utils/etiquetasMotivo";

// Carga los motivos configurados (config_subcategorias). Logísticos primero, luego por nombre.
export function useMotivos() {
  const [motivos, setMotivos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("config_subcategorias")
      .select("subcategoria, categoria, evidencias_requeridas, alcance_forzado")
      .eq("activo", true)
      .then(({ data, error: errorConsulta }) => {
        if (errorConsulta) setError(errorConsulta.message);
        const ordenados = (data ?? []).slice().sort((a, b) => {
          if (a.categoria !== b.categoria) return a.categoria === "LOGISTICO" ? -1 : 1;
          return etiquetaMotivo(a.subcategoria).localeCompare(etiquetaMotivo(b.subcategoria), "es");
        });
        setMotivos(ordenados);
        setCargando(false);
      });
  }, []);

  return { motivos, cargando, error };
}
