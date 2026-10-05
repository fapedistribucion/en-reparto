import { supabase } from "../lib/supabaseClient";
import { subirEvidencias } from "../transportista/servicioReclamo";

// Sube las fotos (misma carpeta de la empresa de transporte del ticket, así el transportista
// también las ve) y luego registra la observación + adjuntos en una sola transacción
// (función agregar_observacion_sac). Devuelve { ticket_id, observacion_id }.
export async function agregarProductoSAC({ ticket, observacion }) {
  const { observacionesPayload } = await subirEvidencias({
    empresa: ticket.empresa_transporte,
    archivosFactura: [], // la foto de la factura ya está en el ticket
    observaciones: [observacion],
  });

  const { data, error } = await supabase.rpc("agregar_observacion_sac", {
    p_ticket_id: ticket.id,
    p_observacion: observacionesPayload[0],
  });

  if (error) throw new Error(error.message);
  return data;
}
