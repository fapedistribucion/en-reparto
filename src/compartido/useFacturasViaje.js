import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Trae fecha_viaje desde facturas_data para las facturas visibles en pantalla
// (no se carga toda la tabla completa: se filtra solo por las facturas de los
// tickets ya cargados). Devuelve un Map factura -> fecha_viaje.
export function useFacturasViaje(facturas) {
  const [mapa, setMapa] = useState(new Map());

  useEffect(() => {
    let cancelado = false;
    const lista = [...new Set((facturas ?? []).filter(Boolean))];

    if (lista.length === 0) {
      setMapa(new Map());
      return;
    }

    supabase
      .from("facturas_data")
      .select("factura, fecha_viaje")
      .in("factura", lista)
      .then(({ data, error }) => {
        if (cancelado) return;
        if (error) {
          setMapa(new Map());
          return;
        }
        setMapa(new Map((data ?? []).map((f) => [f.factura, f.fecha_viaje])));
      });

    return () => {
      cancelado = true;
    };
  }, [facturas]);

  return mapa;
}
