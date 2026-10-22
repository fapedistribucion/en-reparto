import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Datos de la factura que viven en facturas_data (no en el ticket): fecha de factura, centro de
// distribución y, a partir de la ruta (interna), la región y el departamento. Se leen de la vista
// facturas_ubicacion solo para las facturas de los tickets que están en pantalla.
// Devuelve { datos, listo }: datos = Map factura -> { fecha_factura, region, departamento, centro_distribucion };
// listo = ya terminó de consultar (mientras no, "sin región" no significa que la factura no tenga).
const LOTE = 150; // el filtro .in() viaja en la URL: se pide por tandas para no pasarse del largo permitido

export function useDatosFactura(facturas) {
  const [estado, setEstado] = useState({ datos: new Map(), listo: false });

  useEffect(() => {
    let cancelado = false;
    const lista = [...new Set((facturas ?? []).filter(Boolean))];

    if (lista.length === 0) {
      setEstado({ datos: new Map(), listo: true });
      return undefined;
    }

    const tandas = [];
    for (let i = 0; i < lista.length; i += LOTE) tandas.push(lista.slice(i, i + LOTE));

    Promise.all(
      tandas.map((tanda) =>
        supabase
          .from("facturas_ubicacion")
          .select("factura, fecha_factura, region, departamento, centro_distribucion")
          .in("factura", tanda)
      )
    ).then((respuestas) => {
      if (cancelado) return;
      const nuevo = new Map();
      respuestas.forEach(({ data, error }) => {
        if (error) return;
        (data ?? []).forEach((f) => nuevo.set(f.factura, f));
      });
      setEstado({ datos: nuevo, listo: true });
    });

    return () => {
      cancelado = true;
    };
  }, [facturas]);

  return estado;
}

// Agrega al ticket los datos de su factura (null si todavía no llegaron o la factura no los tiene).
export function conDatosFactura(ticket, mapa) {
  const d = mapa.get(ticket.factura);
  return {
    ...ticket,
    fecha_factura: d?.fecha_factura ?? null,
    region: d?.region ?? null,
    departamento: d?.departamento ?? null,
    centro_distribucion: d?.centro_distribucion ?? null,
  };
}
