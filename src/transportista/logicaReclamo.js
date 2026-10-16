// Lógica pura del formulario de reclamo (sin React ni Supabase), para poder probarla aislada.

import { etiquetaEvidencia, reglaEvidencia } from "../utils/etiquetasEvidencia.js";
import { etiquetaMotivo } from "../utils/etiquetasMotivo.js";

// Formato del N° de bulto: exactamente 15 caracteres, letras o números.
export const LARGO_BULTO = 15;
export const MAX_OBSERVACION = 500;

// Deja solo letras y números (máx. 15, en mayúsculas): lo que se escribe o pega en el campo de bulto.
export function limpiarBulto(texto) {
  return String(texto ?? "").replace(/[^A-Za-z0-9]/g, "").slice(0, LARGO_BULTO).toUpperCase();
}

// Deja solo dígitos: lo que se escribe o pega en el campo de cantidad.
export function limpiarCantidad(texto) {
  return String(texto ?? "").replace(/\D/g, "").slice(0, 7);
}

export function bultoValido(texto) {
  return new RegExp(`^[A-Za-z0-9]{${LARGO_BULTO}}$`).test(String(texto ?? "").trim());
}

// El tope de cantidad es POR MOTIVO: un mismo producto puede tener varios motivos y la suma entre
// motivos no se limita (una misma unidad puede tener 2 motivos). Solo cuenta lo ya registrado con el
// MISMO motivo para el mismo producto.
export function claveProductoMotivo(posicion, subcategoria) {
  return `${posicion}|${subcategoria}`;
}

export function motivoDe(motivos, subcategoria) {
  return motivos.find((m) => m.subcategoria === subcategoria) ?? null;
}

// Prefijo de la opción "motivo sin alcance" (ej. "SIN_ALCANCE:SOBRANTE"): el ticket no lleva alcance.
export const PREFIJO_SIN_ALCANCE = "SIN_ALCANCE";

// La "opción" que elige el transportista puede ser:
//   "RECHAZO_TOTAL" | "RECHAZO_PARCIAL" | "SIN_ALCANCE:<motivo>" (Sobrante: motivo propio, sin alcance)
//   | "<alcance>:<motivo>" (si algún motivo viene con alcance_forzado en config_subcategorias;
//   hoy ningún motivo lo usa, pero el mecanismo queda listo por si se necesita a futuro)
// `seleccionada` es true apenas hay una opción elegida (aunque no tenga alcance).
export function interpretarOpcion(opcion) {
  if (!opcion) return { alcance: null, motivoFijo: null, seleccionada: false };
  if (opcion.includes(":")) {
    const [alcance, motivoFijo] = opcion.split(":");
    if (alcance === PREFIJO_SIN_ALCANCE) return { alcance: null, motivoFijo, seleccionada: true };
    return { alcance, motivoFijo, seleccionada: true };
  }
  return { alcance: opcion, motivoFijo: null, seleccionada: true };
}

// ¿La opción se llena con tarjetas de producto? Rechazo parcial (cada tarjeta con su motivo) y
// Sobrante (cada tarjeta con el motivo fijo SOBRANTE, sin selector de motivo).
export function usaTarjetas(opcion) {
  const { alcance, motivoFijo, seleccionada } = interpretarOpcion(opcion);
  return alcance === "RECHAZO_PARCIAL" || (seleccionada && alcance === null && Boolean(motivoFijo));
}

export function evidenciasDe(motivos, subcategoria) {
  return motivos.find((m) => m.subcategoria === subcategoria)?.evidencias_requeridas ?? [];
}

// Cada tipo exige una cantidad de fotos entre min y max (ver reglaEvidencia: normalmente
// exacta; Avería admite de 1 hasta 4 en la foto del producto). Esto detecta tanto lo que
// no se subió como lo que quedó incompleto o de más (SubidaEvidencia ya impide subir de
// más, así que en la práctica esto solo puede quedar por debajo del mínimo).
function faltantes(motivos, subcategoria, archivos) {
  return evidenciasDe(motivos, subcategoria).filter((tipo) => {
    const { min, max } = reglaEvidencia(tipo, subcategoria);
    const n = archivos?.[tipo]?.length ?? 0;
    return n < min || n > max;
  });
}

function descripcionFaltante(tipo, subcategoria, archivos) {
  const { min, max } = reglaEvidencia(tipo, subcategoria);
  const n = archivos?.[tipo]?.length ?? 0;
  const detalle = min === max ? `${n}/${max}` : `${n}/${max}, mínimo ${min}`;
  return `${etiquetaEvidencia(tipo, subcategoria)} (${detalle})`;
}

// Solo viajan las fotos que el motivo elegido exige (si cambió de motivo, las anteriores sobran)
function soloRequeridas(motivos, subcategoria, archivos) {
  const requeridas = evidenciasDe(motivos, subcategoria);
  return Object.fromEntries(requeridas.map((tipo) => [tipo, archivos?.[tipo] ?? []]));
}

export function derivarObservaciones({ opcion, motivos, motivoTotal, archivosMotivo, tarjetas, observacionTotal = "" }) {
  const { motivoFijo } = interpretarOpcion(opcion);

  if (usaTarjetas(opcion)) {
    // En Sobrante el motivo es el de la opción (no se elige por tarjeta)
    return tarjetas.map((t) => {
      const subcategoria = motivoFijo ?? t.subcategoria;
      return {
        subcategoria,
        posicion: t.posicion,
        cantidad_observada: Number(t.cantidad),
        numero_bulto: t.bulto.trim(),
        observacion: null,
        archivos: soloRequeridas(motivos, subcategoria, t.archivos),
      };
    });
  }

  const subcategoria = motivoFijo ?? motivoTotal;
  return [
    {
      subcategoria,
      posicion: null,
      cantidad_observada: null,
      numero_bulto: null,
      observacion: motivoDe(motivos, subcategoria)?.pide_observacion ? String(observacionTotal ?? "").trim() : null,
      archivos: soloRequeridas(motivos, subcategoria, archivosMotivo),
    },
  ];
}

// Devuelve el primer problema encontrado (texto para el usuario) o null si todo está bien.
// `cantidadesPrevias` (Map claveProductoMotivo -> cantidad ya observada en el ticket) y `exigirFactura=false`
// los usa SAC al agregar un producto a un ticket que ya existe (ver validarProductoAgregado).
export function validarReclamo({
  opcion,
  motivos,
  motivoTotal,
  archivosMotivo,
  tarjetas,
  productos,
  archivosFactura,
  observacionTotal = "",
  cantidadesPrevias = new Map(),
  exigirFactura = true,
}) {
  const { motivoFijo, seleccionada } = interpretarOpcion(opcion);
  if (!seleccionada) return "Indica qué ocurrió con la entrega.";

  if (usaTarjetas(opcion)) {
    if (tarjetas.length === 0) return "Agrega al menos un producto.";

    const acumulado = new Map();
    for (let i = 0; i < tarjetas.length; i++) {
      const t = tarjetas[i];
      const n = i + 1;

      if (t.posicion == null) return `Producto ${n}: selecciona el producto.`;
      const producto = productos.find((p) => p.posicion === t.posicion);
      if (!producto) return `Producto ${n}: el producto ya no existe en esta factura.`;
      const subcategoria = motivoFijo ?? t.subcategoria;
      if (!subcategoria) return `Producto ${n}: selecciona el motivo.`;

      if (motivoDe(motivos, subcategoria)?.solo_rechazo_total) {
        return `Producto ${n}: el motivo ${etiquetaMotivo(subcategoria)} solo se usa en un rechazo total.`;
      }

      const textoCantidad = String(t.cantidad ?? "").trim();
      if (!/^\d+$/.test(textoCantidad) || Number(textoCantidad) <= 0) {
        return `Producto ${n}: la cantidad observada debe ser un número entero mayor que 0.`;
      }
      const cantidad = Number(textoCantidad);
      // El tope es por motivo: la cantidad observada no puede superar lo facturado dentro del mismo
      // motivo. Un mismo producto sí puede tener varios motivos (cada uno con su cantidad).
      // Sobrante no tiene tope: es producto que llegó de más que lo facturado.
      if (!motivoFijo) {
        const clave = claveProductoMotivo(t.posicion, subcategoria);
        const previo = (cantidadesPrevias.get(clave) ?? 0) + (acumulado.get(clave) ?? 0);
        const total = previo + cantidad;
        if (total > Number(producto.cantidad)) {
          return previo > 0
            ? `Producto ${n}: con el motivo ${etiquetaMotivo(subcategoria)} ya hay ${previo} registrado(s); entre todos superan lo facturado (${producto.cantidad}).`
            : `Producto ${n}: la cantidad observada supera lo facturado (${producto.cantidad}).`;
        }
        acumulado.set(clave, total);
      }

      if (!bultoValido(t.bulto)) {
        return `Producto ${n}: el N° de bulto debe tener exactamente ${LARGO_BULTO} caracteres (letras o números).`;
      }

      const falta = faltantes(motivos, subcategoria, t.archivos);
      if (falta.length) {
        return `Producto ${n}: falta subir ${falta.map((tipo) => descripcionFaltante(tipo, subcategoria, t.archivos)).join(", ")}.`;
      }
    }
  } else {
    const subcategoria = motivoFijo ?? motivoTotal;
    if (!subcategoria) return "Selecciona el motivo.";
    if (motivoDe(motivos, subcategoria)?.pide_observacion) {
      const texto = String(observacionTotal ?? "").trim();
      if (!texto) return "Escribe la observación.";
      if (texto.length > MAX_OBSERVACION) return `La observación no puede superar los ${MAX_OBSERVACION} caracteres.`;
    }
    const falta = faltantes(motivos, subcategoria, archivosMotivo);
    if (falta.length) {
      return `Falta subir ${falta.map((tipo) => descripcionFaltante(tipo, subcategoria, archivosMotivo)).join(", ")}.`;
    }
  }

  if (exigirFactura && (!archivosFactura || archivosFactura.length === 0)) return "Sube la foto de la factura.";
  return null;
}

// SAC agrega UN producto a un ticket existente (rechazo parcial): mismas reglas de producto,
// motivo, cantidad, bulto y fotos que el transportista, pero la cantidad también cuenta lo que
// ya está observado en el ticket y no se pide la foto de la factura (ya está en el ticket).
export function validarProductoAgregado({ tarjeta, motivos, productos, cantidadesPrevias }) {
  return validarReclamo({
    opcion: "RECHAZO_PARCIAL",
    motivos,
    tarjetas: [tarjeta],
    productos,
    cantidadesPrevias,
    exigirFactura: false,
  });
}

// Suma de cantidad_observada por (producto, motivo) de las observaciones ya registradas en el ticket.
// La clave es claveProductoMotivo(posicion, subcategoria).
export function cantidadesPreviasPorMotivo(observaciones) {
  const mapa = new Map();
  (observaciones ?? []).forEach((o) => {
    if (o.posicion == null) return;
    const clave = claveProductoMotivo(o.posicion, o.subcategoria);
    mapa.set(clave, (mapa.get(clave) ?? 0) + Number(o.cantidad_observada ?? 0));
  });
  return mapa;
}

// ¿Alguna observación es No Logística? (entonces el transportista debe coordinar con SAC)
export function requiereSAC(observaciones, motivos) {
  return observaciones.some(
    (o) => motivos.find((m) => m.subcategoria === o.subcategoria)?.categoria === "NO_LOGISTICO"
  );
}
