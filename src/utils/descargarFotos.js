import { supabase } from "../lib/supabaseClient";
import { etiquetaMotivo } from "./etiquetasMotivo";

// Descarga de fotos: una sola foto (desde el visor) o todas en un .zip (botón "Descargar imágenes").
// El .zip se arma en el navegador, sin librerías: las fotos ya son JPG comprimidos, así que el zip
// las guarda tal cual (sin volver a comprimir).

const BUCKET = "evidencias";
const VIGENCIA_SEGUNDOS = 60 * 10;
const DESCARGAS_EN_PARALELO = 4;

// Nombre corto de cada tipo de evidencia para los archivos descargados.
const NOMBRE_TIPO = {
  foto_factura: "factura",
  foto_etiqueta_ban: "etiqueta-BAN",
  foto_4_lados_bulto: "bulto",
  foto_4_lados_caja: "bulto",
  foto_producto: "producto",
  foto_producto_fecha_vencimiento: "vencimiento",
  foto_producto_lote: "lote",
};

// ---------- Nombres seguros para archivos y carpetas ----------

export function nombreSeguro(texto, maximo = 80) {
  const limpio = String(texto ?? "")
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/, "");
  return limpio.slice(0, maximo).trim() || "sin-nombre";
}

function extension(adjunto) {
  const m = /\.([A-Za-z0-9]{2,5})$/.exec(adjunto?.url_storage ?? "");
  return (m ? m[1] : "jpg").toLowerCase();
}

function numeroDeFoto(adjunto, respaldo) {
  const m = /-(\d+)\.[A-Za-z0-9]+$/.exec(adjunto?.url_storage ?? "");
  return m ? m[1] : String(respaldo);
}

// Nombre de la carpeta de una observación: posición-motivo-nombre del producto.
export function nombreCarpetaObservacion(o) {
  const motivo = etiquetaMotivo(o.subcategoria);
  return o.posicion != null
    ? nombreSeguro(`${o.posicion}-${motivo}-${o.nombre_producto ?? ""}`)
    : nombreSeguro(`Toda la factura-${motivo}`);
}

// Evita que dos archivos/carpetas con el mismo nombre se pisen: agrega " (2)", " (3)"...
function nombreUnico(nombre, usados) {
  if (!usados.has(nombre)) {
    usados.add(nombre);
    return nombre;
  }
  const punto = nombre.lastIndexOf(".");
  const base = punto > 0 ? nombre.slice(0, punto) : nombre;
  const ext = punto > 0 ? nombre.slice(punto) : "";
  for (let i = 2; ; i++) {
    const candidato = `${base} (${i})${ext}`;
    if (!usados.has(candidato)) {
      usados.add(candidato);
      return candidato;
    }
  }
}

function prefijoTicket(ticket) {
  return ticket?.codigo_ticket ? ticket.codigo_ticket : "Sin ticket";
}

// ---------- Descarga de una foto ----------

function guardarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// URLs firmadas nuevas (las del popup pueden haber vencido si estuvo mucho tiempo abierto).
async function urlsFrescas(rutas) {
  const porRuta = new Map();
  if (rutas.length === 0) return porRuta;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(rutas, VIGENCIA_SEGUNDOS);
  (data ?? []).forEach((f) => {
    if (f.signedUrl) porRuta.set(f.path, f.signedUrl);
  });
  return porRuta;
}

async function traerBytes(url) {
  const respuesta = await fetch(url);
  if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
  return respuesta.arrayBuffer();
}

// Nombre de una foto suelta: <ticket>_<factura|posX-motivo>_<tipo>-<n>.jpg
export function nombreFotoSuelta({ ticket, adjunto, observacion }) {
  const tipo = NOMBRE_TIPO[adjunto.tipo_evidencia] ?? adjunto.tipo_evidencia;
  const donde = observacion ? nombreCarpetaObservacion(observacion) : ticket.factura;
  return nombreSeguro(`${prefijoTicket(ticket)}_${donde}_${tipo}-${numeroDeFoto(adjunto, 1)}`, 150) + `.${extension(adjunto)}`;
}

export async function descargarFoto({ ticket, adjunto, observacion }) {
  const frescas = await urlsFrescas([adjunto.url_storage]);
  const url = frescas.get(adjunto.url_storage) ?? adjunto.urlVisible;
  if (!url) throw new Error("La foto no está disponible.");
  const bytes = await traerBytes(url);
  guardarBlob(new Blob([bytes], { type: "image/jpeg" }), nombreFotoSuelta({ ticket, adjunto, observacion }));
}

// ---------- Descarga de todas las fotos en un .zip ----------
//
// Estructura (igual en "Por factura" y "Por producto"; en "Por producto" solo viene la carpeta del
// producto observado):
//   <ticket>_<factura>.zip
//     <factura>.jpg                          <- foto(s) de la factura, directo en la raíz
//     1-Avería-NOMBRE DEL PRODUCTO/          <- posición-motivo-nombre del producto
//       producto-1.jpg, bulto-1.jpg ...
//
// `observaciones` y `adjuntos` son los que ya muestra el popup. Devuelve { total, fallidas }.
export async function descargarZip({ ticket, observaciones, adjuntos, soloObservacion = null }) {
  const archivos = []; // { ruta, adjunto }
  const carpetasUsadas = new Set();
  const nombresRaiz = new Set();

  adjuntos
    .filter((a) => a.observacion_id === null)
    .forEach((a, i) => {
      const nombre = nombreUnico(`${nombreSeguro(ticket.factura)}.${extension(a)}`, nombresRaiz);
      archivos.push({ ruta: nombre, adjunto: a });
    });

  const observacionesZip = soloObservacion ? [soloObservacion] : observaciones;
  observacionesZip.forEach((o) => {
    const carpeta = nombreUnico(nombreCarpetaObservacion(o), carpetasUsadas);
    const usados = new Set();
    adjuntos
      .filter((a) => a.observacion_id === o.id)
      .forEach((a, i) => {
        const tipo = NOMBRE_TIPO[a.tipo_evidencia] ?? a.tipo_evidencia;
        const nombre = nombreUnico(`${tipo}-${numeroDeFoto(a, i + 1)}.${extension(a)}`, usados);
        archivos.push({ ruta: `${carpeta}/${nombre}`, adjunto: a });
      });
  });

  if (archivos.length === 0) throw new Error("No hay fotos para descargar.");

  const frescas = await urlsFrescas(archivos.map((f) => f.adjunto.url_storage));
  const listos = [];
  let fallidas = 0;

  for (let i = 0; i < archivos.length; i += DESCARGAS_EN_PARALELO) {
    await Promise.all(
      archivos.slice(i, i + DESCARGAS_EN_PARALELO).map(async (f) => {
        try {
          const url = frescas.get(f.adjunto.url_storage) ?? f.adjunto.urlVisible;
          if (!url) throw new Error("sin url");
          listos.push({ nombre: f.ruta, datos: new Uint8Array(await traerBytes(url)), orden: archivos.indexOf(f) });
        } catch {
          fallidas += 1;
        }
      }),
    );
  }

  if (listos.length === 0) throw new Error("No se pudieron descargar las fotos. Revisa tu conexión e intenta de nuevo.");
  listos.sort((a, b) => a.orden - b.orden);

  const sufijo = soloObservacion ? `_${nombreCarpetaObservacion(soloObservacion)}` : "";
  const nombreZip = nombreSeguro(`${prefijoTicket(ticket)}_${ticket.factura}${sufijo}`, 150) + ".zip";
  guardarBlob(crearZip(listos), nombreZip);
  return { total: archivos.length, fallidas };
}

// ---------- Escritor de .zip (sin compresión, nombres en UTF-8) ----------

const TABLA_CRC = (() => {
  const tabla = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabla[n] = c >>> 0;
  }
  return tabla;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = TABLA_CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// `archivos`: [{ nombre: "carpeta/foto.jpg", datos: Uint8Array }] -> Blob (application/zip)
export function crearZip(archivos, fecha = new Date()) {
  const codificador = new TextEncoder();
  const hora = (fecha.getHours() << 11) | (fecha.getMinutes() << 5) | (fecha.getSeconds() >> 1);
  const dia = (Math.max(fecha.getFullYear() - 1980, 0) << 9) | ((fecha.getMonth() + 1) << 5) | fecha.getDate();

  const partes = [];
  const central = [];
  let posicion = 0;

  for (const { nombre, datos } of archivos) {
    const nombreBytes = codificador.encode(nombre);
    const crc = crc32(datos);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true); // versión mínima
    local.setUint16(6, 0x0800, true); // nombres en UTF-8
    local.setUint16(8, 0, true); // sin compresión
    local.setUint16(10, hora, true);
    local.setUint16(12, dia, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, datos.length, true);
    local.setUint32(22, datos.length, true);
    local.setUint16(26, nombreBytes.length, true);
    local.setUint16(28, 0, true);

    const entrada = new DataView(new ArrayBuffer(46));
    entrada.setUint32(0, 0x02014b50, true);
    entrada.setUint16(4, 20, true);
    entrada.setUint16(6, 20, true);
    entrada.setUint16(8, 0x0800, true);
    entrada.setUint16(10, 0, true);
    entrada.setUint16(12, hora, true);
    entrada.setUint16(14, dia, true);
    entrada.setUint32(16, crc, true);
    entrada.setUint32(20, datos.length, true);
    entrada.setUint32(24, datos.length, true);
    entrada.setUint16(28, nombreBytes.length, true);
    entrada.setUint32(42, posicion, true);

    partes.push(new Uint8Array(local.buffer), nombreBytes, datos);
    central.push(new Uint8Array(entrada.buffer), nombreBytes);
    posicion += 30 + nombreBytes.length + datos.length;
  }

  const tamanoCentral = central.reduce((suma, p) => suma + p.length, 0);
  const fin = new DataView(new ArrayBuffer(22));
  fin.setUint32(0, 0x06054b50, true);
  fin.setUint16(8, archivos.length, true);
  fin.setUint16(10, archivos.length, true);
  fin.setUint32(12, tamanoCentral, true);
  fin.setUint32(16, posicion, true);

  return new Blob([...partes, ...central, new Uint8Array(fin.buffer)], { type: "application/zip" });
}
