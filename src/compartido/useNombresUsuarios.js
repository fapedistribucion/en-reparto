import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Nombre de las personas que aprobaron un ticket o pusieron una nota de crédito.
// Recibe una lista de ids de usuario y devuelve un Map id -> nombre. Los pide en una sola llamada a la función
// nombres_usuarios de la base (solo responde a SAC, LI y Liquidaciones; para el transportista vuelve vacío)
// y recuerda los que ya conoce para no volver a pedirlos.
const conocidos = new Map(); // id -> nombre (compartido entre pantallas)

export function useNombresUsuarios(ids) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelado = false;
    const faltan = [...new Set((ids ?? []).filter(Boolean))].filter((id) => !conocidos.has(id));
    if (faltan.length === 0) return undefined;

    supabase.rpc("nombres_usuarios", { p_ids: faltan }).then(({ data, error }) => {
      if (cancelado || error) return;
      (data ?? []).forEach((u) => conocidos.set(u.id, u.nombre));
      setVersion((v) => v + 1);
    });

    return () => {
      cancelado = true;
    };
  }, [ids]);

  // `version` cambia cuando llegan nombres nuevos, así quien use este mapa vuelve a calcular.
  return { nombre: (id) => (id ? conocidos.get(id) ?? null : null), version };
}
