import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Datos que la base calcula por ticket (vista tickets_complemento): fecha del último cambio de estado,
// fecha límite de llegada a LI y lead time. Se piden solo para los tickets que están en pantalla.
// Devuelve un Map ticket.id -> { fecha_estado, fecha_limite_li, lead_time_li }.
const LOTE = 100; // el filtro .in() viaja en la URL (los id son largos): se pide por tandas

export function useDatosTicket(ids) {
  const [mapa, setMapa] = useState(new Map());

  useEffect(() => {
    let cancelado = false;
    const lista = [...new Set((ids ?? []).filter(Boolean))];

    if (lista.length === 0) {
      setMapa(new Map());
      return undefined;
    }

    const tandas = [];
    for (let i = 0; i < lista.length; i += LOTE) tandas.push(lista.slice(i, i + LOTE));

    Promise.all(
      tandas.map((tanda) =>
        supabase.from("tickets_complemento").select("id, fecha_estado, fecha_limite_li, lead_time_li").in("id", tanda)
      )
    ).then((respuestas) => {
      if (cancelado) return;
      const nuevo = new Map();
      respuestas.forEach(({ data, error }) => {
        if (error) return;
        (data ?? []).forEach((d) => nuevo.set(d.id, d));
      });
      setMapa(nuevo);
    });

    return () => {
      cancelado = true;
    };
  }, [ids]);

  return mapa;
}

// Agrega al ticket esos datos (null si todavía no llegaron).
export function conDatosTicket(ticket, mapa) {
  const d = mapa.get(ticket.id);
  return {
    ...ticket,
    fecha_estado: d?.fecha_estado ?? null,
    fecha_limite_li: d?.fecha_limite_li ?? null,
    lead_time_li: d?.lead_time_li ?? null,
  };
}
