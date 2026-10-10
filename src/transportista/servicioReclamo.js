import { supabase } from "../lib/supabaseClient";

const BUCKET = "evidencias";
const SUBIDAS_EN_PARALELO = 3;

async function enPaquetes(items, tamano, fn) {
  for (let i = 0; i < items.length; i += tamano) {
    await Promise.all(items.slice(i, i + tamano).map(fn));
  }
}

// Sube todas las fotos a una carpeta nueva por intento (así un reintento nunca choca con archivos anteriores)
// y devuelve la estructura que espera la función crear_ticket.
export async function subirEvidencias({ empresa, archivosFactura, observaciones }) {
  const carpeta = `${empresa}/${crypto.randomUUID()}`;
  const tareas = [];

  const evidenciasTicket = archivosFactura.map((archivo, i) => {
    const path = `${carpeta}/foto_factura-${i + 1}.jpg`;
    tareas.push({ archivo, path });
    return { tipo: "foto_factura", path };
  });

  const observacionesPayload = observaciones.map((obs, k) => {
    const evidencias = [];
    for (const [tipo, archivos] of Object.entries(obs.archivos)) {
      archivos.forEach((archivo, i) => {
        const path = `${carpeta}/obs-${k + 1}/${tipo}-${i + 1}.jpg`;
        tareas.push({ archivo, path });
        evidencias.push({ tipo, path });
      });
    }
    return {
      subcategoria: obs.subcategoria,
      posicion: obs.posicion,
      cantidad_observada: obs.cantidad_observada,
      numero_bulto: obs.numero_bulto,
      evidencias,
    };
  });

  await enPaquetes(tareas, SUBIDAS_EN_PARALELO, async ({ archivo, path }) => {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, archivo, { contentType: "image/jpeg" });
    if (error) throw new Error(`No se pudo subir una foto (${error.message}). Revisa tu conexión e intenta de nuevo.`);
  });

  return { evidenciasTicket, observacionesPayload };
}

// Crea ticket + observaciones + adjuntos en una sola transacción (función de base de datos).
export async function crearTicket({ factura, alcance, evidenciasTicket, observacionesPayload }) {
  const { data, error } = await supabase.rpc("crear_ticket", {
    p_factura: factura,
    p_alcance: alcance,
    p_factura_verificada_ia: null, // la verificación automática con OCR se retiró; la columna queda vacía
    p_evidencias_ticket: evidenciasTicket,
    p_observaciones: observacionesPayload,
  });

  if (error) {
    if (/row-level security/i.test(error.message)) {
      throw new Error("Esta factura no corresponde a tu empresa de transporte.");
    }
    throw new Error(error.message);
  }
  return data; // { ticket_id, codigo_ticket, observacion_ids }
}
