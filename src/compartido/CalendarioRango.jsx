import { useState } from "react";

const MESES = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
  "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
];
const DIAS_SEMANA = ["D", "L", "M", "X", "J", "V", "S"];

function fechaDesdeIso(iso) {
  return new Date(`${iso}T00:00:00Z`);
}
function isoDesdeFecha(fecha) {
  return fecha.toISOString().slice(0, 10);
}
function sumarDias(iso, n) {
  const f = fechaDesdeIso(iso);
  f.setUTCDate(f.getUTCDate() + n);
  return isoDesdeFecha(f);
}
function formatearCorto(iso) {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

function generarCeldas(mesVisible) {
  const anio = mesVisible.getUTCFullYear();
  const mes = mesVisible.getUTCMonth();
  const primerDia = new Date(Date.UTC(anio, mes, 1));
  const diasEnMes = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
  const celdas = [];
  for (let i = 0; i < primerDia.getUTCDay(); i++) celdas.push(null);
  for (let d = 1; d <= diasEnMes; d++) celdas.push(isoDesdeFecha(new Date(Date.UTC(anio, mes, d))));
  while (celdas.length % 7 !== 0) celdas.push(null);
  return celdas;
}

// Calendario de un mes con selección de rango por clic directo (clic en el día de inicio,
// clic en el día de fin). `maxDias`: tamaño máximo del rango, en días, contando ambos extremos.
export default function CalendarioRango({ desde, hasta, onCambiarRango, maxDias = 31 }) {
  const [mesVisible, setMesVisible] = useState(() => {
    const base = desde ? fechaDesdeIso(desde) : new Date();
    return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1));
  });

  function irMesAnterior() {
    setMesVisible((m) => new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() - 1, 1)));
  }
  function irMesSiguiente() {
    setMesVisible((m) => new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 1)));
  }

  function clicDia(iso) {
    if (!desde || (desde && hasta)) {
      onCambiarRango({ desde: iso, hasta: "" });
      return;
    }
    if (iso < desde) {
      onCambiarRango({ desde: iso, hasta: "" });
      return;
    }
    const limite = sumarDias(desde, maxDias - 1);
    onCambiarRango({ desde, hasta: iso > limite ? limite : iso });
  }

  const celdas = generarCeldas(mesVisible);

  let textoRango = `Selecciona un rango (máx. ${maxDias} días)`;
  if (desde && hasta) textoRango = `${formatearCorto(desde)} – ${formatearCorto(hasta)}`;
  else if (desde) textoRango = `${formatearCorto(desde)} – selecciona el final`;

  return (
    <div className="calendario-rango">
      <div className="calendario-encabezado">
        <button type="button" className="calendario-nav" onClick={irMesAnterior} aria-label="Mes anterior">
          ‹
        </button>
        <strong>
          {MESES[mesVisible.getUTCMonth()]} {mesVisible.getUTCFullYear()}
        </strong>
        <button type="button" className="calendario-nav" onClick={irMesSiguiente} aria-label="Mes siguiente">
          ›
        </button>
      </div>

      <div className="calendario-grilla calendario-dias-semana">
        {DIAS_SEMANA.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="calendario-grilla">
        {celdas.map((iso, i) => {
          if (!iso) return <span key={i} />;
          const esExtremo = iso === desde || iso === hasta;
          const enRango = desde && hasta && iso > desde && iso < hasta;
          return (
            <button
              key={iso}
              type="button"
              className={`calendario-dia ${esExtremo ? "extremo-rango" : ""} ${enRango ? "en-rango" : ""}`}
              onClick={() => clicDia(iso)}
            >
              {Number(iso.slice(8, 10))}
            </button>
          );
        })}
      </div>

      <div className="calendario-rango-texto">{textoRango}</div>
    </div>
  );
}
