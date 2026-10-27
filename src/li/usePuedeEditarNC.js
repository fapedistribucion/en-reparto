import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// ¿Este usuario de LI puede corregir una Nota de Crédito ya registrada? Lo decide la base
// (tabla config_editores_nc, función puede_editar_nc): aquí solo se usa para mostrar el lápiz y el formulario.
// La base vuelve a validarlo al guardar, así que ocultar el lápiz no es la única barrera.
export function usePuedeEditarNC() {
  const [puede, setPuede] = useState(false);

  useEffect(() => {
    let cancelado = false;
    supabase.rpc("puede_editar_nc").then(({ data, error }) => {
      if (!cancelado && !error) setPuede(data === true);
    });
    return () => {
      cancelado = true;
    };
  }, []);

  return puede;
}
