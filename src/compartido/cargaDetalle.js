import { supabase } from "../lib/supabaseClient";

// Carga (y precarga) del detalle de un ticket: observaciones + adjuntos con URL firmada.
//
// Por qué existe: abrir el popup tenía que esperar, DESPUÉS del clic, a (1) las consultas,
// (2) la firma de las URLs del bucket privado y (3) la descarga de las fotos. Ahora:
//  - `precargarDetalle` se llama al pasar el cursor / tocar el botón "Ver", así gran parte
//    del trabajo ya está hecho cuando se hace clic;
//  - lo cargado queda en memoria (se pierde al recargar la página): reabrir el mismo ticket
//    es instantáneo y se refresca en segundo plano;
//  - las URLs ya firmadas se reutilizan (misma URL = el navegador no vuelve a bajar la foto);
//  - las fotos se empiezan a bajar apenas hay URL, sin esperar a que se pinte el popup.

const SEGUNDOS_VIGENCIA_URL = 60 * 10; // 10 minutos
const URL_REUTILIZABLE_MS = 8 * 60 * 1000; // margen de 2 min antes de que venza la firma
const FRESCO_MS = 15 * 1000; // dentro de este lapso no se vuelve a consultar
const MAX_ENTRADAS = 40;

const cache = new Map(); // clave -> { datos, cargadoEn, firmadoEn, promesa }

function clave(ticketId, soloObservacionId) {
  return `${ticketId}|${soloObservacionId ?? ""}`;
}

async function traer(ticketId, soloObservacionId, urlsPrevias) {
  let obsQuery = supabase.from("ticket_observaciones").select("*").eq("ticket_id", ticketId);
  let adjQuery = supabase.from("ticket_adjuntos").select("*").eq("ticket_id", ticketId);

  // Modo enfocado (vista "Por producto"): solo esa observación y sus evidencias
  // (+ la foto de factura completa, que no tiene observacion_id).
  if (soloObservacionId) {
    obsQuery = obsQuery.eq("id", soloObservacionId);
    adjQuery = adjQuery.or(`observacion_id.eq.${soloObservacionId},observacion_id.is.null`);
  }

  const [{ data: obs, error: errorObs }, { data: adj, error: errorAdj }] = await Promise.all([
    obsQuery.order("id"),
    adjQuery.order("id"),
  ]);

  const adjuntos = adj ?? [];
  const urlPorRuta = new Map(urlsPrevias);

  // Solo se firman las rutas que todavía no tienen URL vigente (todas en una sola llamada).
  const faltantes = adjuntos.map((a) => a.url_storage).filter((ruta) => !urlPorRuta.has(ruta));
  let errorFirma = false;
  if (faltantes.length > 0) {
    const { data, error } = await supabase.storage
      .from("evidencias")
      .createSignedUrls(faltantes, SEGUNDOS_VIGENCIA_URL);
    if (error) errorFirma = true;
    (data ?? []).forEach((f) => {
      if (f.signedUrl) urlPorRuta.set(f.path, f.signedUrl);
    });
  }

  return {
    datos: {
      observaciones: obs ?? [],
      adjuntos: adjuntos.map((a) => ({ ...a, urlVisible: urlPorRuta.get(a.url_storage) ?? null })),
    },
    conError: Boolean(errorObs || errorAdj || errorFirma),
  };
}

function precargarImagenes(adjuntos) {
  if (typeof Image === "undefined") return;
  adjuntos.forEach((a) => {
    if (a.urlVisible) {
      const img = new Image();
      img.src = a.urlVisible;
    }
  });
}

function recortarCache() {
  while (cache.size > MAX_ENTRADAS) {
    const masViejo = cache.keys().next().value;
    cache.delete(masViejo);
  }
}

// Lo último cargado para ese ticket (o null). Sirve para pintar el popup al instante.
export function leerDetalleEnCache(ticketId, soloObservacionId) {
  return cache.get(clave(ticketId, soloObservacionId))?.datos ?? null;
}

// Devuelve { observaciones, adjuntos } (adjuntos con `urlVisible`). `forzar` ignora lo "fresco"
// (úsalo después de una acción que cambió datos, ej. validar una observación).
export function cargarDetalle(ticketId, soloObservacionId, { forzar = false } = {}) {
  const k = clave(ticketId, soloObservacionId);
  const previa = cache.get(k);

  if (previa?.promesa && !forzar) return previa.promesa; // ya hay una carga en curso
  if (!forzar && previa?.datos && Date.now() - previa.cargadoEn < FRESCO_MS) {
    return Promise.resolve(previa.datos);
  }

  const reutilizaUrls = previa?.datos && Date.now() - previa.firmadoEn < URL_REUTILIZABLE_MS;
  const urlsPrevias = new Map();
  if (reutilizaUrls) {
    previa.datos.adjuntos.forEach((a) => {
      if (a.urlVisible) urlsPrevias.set(a.url_storage, a.urlVisible);
    });
  }

  const promesa = traer(ticketId, soloObservacionId, urlsPrevias)
    .then(({ datos, conError }) => {
      if (conError) {
        // No se guarda un resultado incompleto: la próxima apertura vuelve a intentar.
        cache.delete(k);
        return datos;
      }
      cache.delete(k); // reinsertar al final = más reciente
      cache.set(k, {
        datos,
        cargadoEn: Date.now(),
        firmadoEn: reutilizaUrls ? previa.firmadoEn : Date.now(),
        promesa: null,
      });
      recortarCache();
      precargarImagenes(datos.adjuntos);
      return datos;
    })
    .catch((error) => {
      const actual = cache.get(k);
      if (actual) cache.set(k, { ...actual, promesa: null });
      throw error;
    });

  cache.set(k, { ...(previa ?? { datos: null, cargadoEn: 0, firmadoEn: 0 }), promesa });
  return promesa;
}

// Se llama al pasar el cursor / tocar "Ver": calienta la caché sin molestar si falla.
export function precargarDetalle(ticketId, soloObservacionId) {
  if (!ticketId) return;
  cargarDetalle(ticketId, soloObservacionId).catch(() => {});
}

// Olvida todo lo cargado de un ticket (en cualquiera de sus vistas). Se usa cuando algo cambia
// los datos desde fuera del popup, p. ej. SAC agrega un producto.
export function invalidarDetalle(ticketId) {
  const prefijo = `${ticketId}|`;
  [...cache.keys()].filter((k) => k.startsWith(prefijo)).forEach((k) => cache.delete(k));
}

// Solo para pruebas.
export function limpiarCacheDetalle() {
  cache.clear();
}
