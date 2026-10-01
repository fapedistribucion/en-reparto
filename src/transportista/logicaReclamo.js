// Lógica pura del formulario de reclamo (sin React ni Supabase), para poder probarla aislada.

import { etiquetaEvidencia, cantidadEvidencia } from "../utils/etiquetasEvidencia.js";

// La "opción" que elige el transportista puede ser:
//   "RECHAZO_TOTAL" | "RECHAZO_PARCIAL" | "<alcance>:<motivo>" (si algún motivo
//   viene con alcance_forzado en config_subcategorias; hoy ningún motivo lo usa,
//   pero el mecanismo queda listo por si se necesita a futuro)
export function interpretarOpcion(opcion) {
  if (!opcion) return { alcance: null, motivoFijo: null };
  if (opcion.includes(":")) {
    const [alcance, motivoFijo] = opcion.split(":");
    return { alcance, motivoFijo };
  }
  return { alcance: opcion, motivoFijo: null };
}

export function evidenciasDe(motivos, subcategoria) {
  return motivos.find((m) => m.subcategoria === subcategoria)?.evidencias_requeridas ?? [];
}

// Cada tipo exige una cantidad EXACTA de fotos (ver cantidadEvidencia): esto detecta
// tanto lo que no se subió como lo que quedó incompleto (SubidaEvidencia ya impide
// subir de más, así que en la práctica esto solo puede quedar por debajo del cupo).
function faltantes(motivos, subcategoria, archivos) {
  return evidenciasDe(motivos, subcategoria).filter(
    (tipo) => (archivos?.[tipo]?.length ?? 0) !== cantidadEvidencia(tipo)
  );
}

function descripcionFaltante(tipo, archivos) {
  return `${etiquetaEvidencia(tipo)} (${archivos?.[tipo]?.length ?? 0}/${cantidadEvidencia(tipo)})`;
}

// Solo viajan las fotos que el motivo elegido exige (si cambió de motivo, las anteriores sobran)
function soloRequeridas(motivos, subcategoria, archivos) {
  const requeridas = evidenciasDe(motivos, subcategoria);
  return Object.fromEntries(requeridas.map((tipo) => [tipo, archivos?.[tipo] ?? []]));
}

export function derivarObservaciones({ opcion, motivos, motivoTotal, archivosMotivo, tarjetas }) {
  const { alcance, motivoFijo } = interpretarOpcion(opcion);

  if (alcance === "RECHAZO_PARCIAL") {
    return tarjetas.map((t) => ({
      subcategoria: t.subcategoria,
      posicion: t.posicion,
      cantidad_observada: Number(t.cantidad),
      numero_bulto: t.bulto.trim(),
      archivos: soloRequeridas(motivos, t.subcategoria, t.archivos),
    }));
  }

  const subcategoria = motivoFijo ?? motivoTotal;
  return [
    {
      subcategoria,
      posicion: null,
      cantidad_observada: null,
      numero_bulto: null,
      archivos: soloRequeridas(motivos, subcategoria, archivosMotivo),
    },
  ];
}

// Devuelve el primer problema encontrado (texto para el usuario) o null si todo está bien.
export function validarReclamo({ opcion, motivos, motivoTotal, archivosMotivo, tarjetas, productos, archivosFactura }) {
  const { alcance, motivoFijo } = interpretarOpcion(opcion);
  if (!alcance) return "Indica qué ocurrió con la entrega.";

  if (alcance === "RECHAZO_PARCIAL") {
    if (tarjetas.length === 0) return "Agrega al menos un producto.";

    const acumulado = new Map();
    for (let i = 0; i < tarjetas.length; i++) {
      const t = tarjetas[i];
      const n = i + 1;

      if (t.posicion == null) return `Producto ${n}: selecciona el producto.`;
      const producto = productos.find((p) => p.posicion === t.posicion);
      if (!producto) return `Producto ${n}: el producto ya no existe en esta factura.`;
      if (!t.subcategoria) return `Producto ${n}: selecciona el motivo.`;

      const cantidad = Number(t.cantidad);
      if (!Number.isFinite(cantidad) || cantidad <= 0) return `Producto ${n}: indica la cantidad observada.`;
      const total = (acumulado.get(t.posicion) ?? 0) + cantidad;
      if (total > Number(producto.cantidad)) {
        return `Producto ${n}: la cantidad observada supera lo facturado (${producto.cantidad}).`;
      }
      acumulado.set(t.posicion, total);

      if (!t.bulto.trim()) return `Producto ${n}: indica el número de bulto.`;

      const falta = faltantes(motivos, t.subcategoria, t.archivos);
      if (falta.length) {
        return `Producto ${n}: falta subir ${falta.map((tipo) => descripcionFaltante(tipo, t.archivos)).join(", ")}.`;
      }
    }
  } else {
    const subcategoria = motivoFijo ?? motivoTotal;
    if (!subcategoria) return "Selecciona el motivo.";
    const falta = faltantes(motivos, subcategoria, archivosMotivo);
    if (falta.length) {
      return `Falta subir ${falta.map((tipo) => descripcionFaltante(tipo, archivosMotivo)).join(", ")}.`;
    }
  }

  if (!archivosFactura || archivosFactura.length === 0) return "Sube la foto de la factura.";
  return null;
}

// ¿Alguna observación es No Logística? (entonces el transportista debe coordinar con SAC)
export function requiereSAC(observaciones, motivos) {
  return observaciones.some(
    (o) => motivos.find((m) => m.subcategoria === o.subcategoria)?.categoria === "NO_LOGISTICO"
  );
}
