import { useEffect, useRef, useState } from "react";
import { IconoCerrar, IconoDescargar, IconoFlechaDerecha, IconoFlechaIzquierda } from "./iconos";

// Visor de fotos a pantalla completa.
//  - `fotos`: [{ url, etiqueta }] de la galería que se abrió (las de la observación + la factura).
//  - `indice`: foto mostrada. `onCambiar(nuevoIndice)`: pasar a otra foto.
//  - `onDescargar(indice)`: descarga la foto que se está viendo (devuelve una promesa).
// Se navega con las flechas de la pantalla, con ← → del teclado o deslizando el dedo. Esc o clic
// fuera de la foto cierra el visor.
export default function VisorFotos({ fotos, indice, onCambiar, onCerrar, onDescargar }) {
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState("");
  const inicioToque = useRef(null);
  const total = fotos.length;
  const foto = fotos[indice];

  function anterior() {
    if (total > 1) onCambiar((indice - 1 + total) % total);
  }
  function siguiente() {
    if (total > 1) onCambiar((indice + 1) % total);
  }

  useEffect(() => {
    function teclas(e) {
      if (e.key === "ArrowLeft") anterior();
      else if (e.key === "ArrowRight") siguiente();
      else if (e.key === "Escape") onCerrar();
    }
    window.addEventListener("keydown", teclas);
    return () => window.removeEventListener("keydown", teclas);
  });

  useEffect(() => {
    setError("");
  }, [indice]);

  async function descargar() {
    setDescargando(true);
    setError("");
    try {
      await onDescargar(indice);
    } catch (e) {
      setError(e.message || "No se pudo descargar la foto.");
    }
    setDescargando(false);
  }

  if (!foto) return null;

  return (
    <div
      className="fondo-modal fondo-modal-foto"
      onClick={(e) => {
        e.stopPropagation();
        onCerrar();
      }}
      onTouchStart={(e) => {
        inicioToque.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (inicioToque.current === null) return;
        const dx = e.changedTouches[0].clientX - inicioToque.current;
        inicioToque.current = null;
        if (Math.abs(dx) > 50) (dx > 0 ? anterior : siguiente)();
      }}
    >
      <div className="visor-barra" onClick={(e) => e.stopPropagation()}>
        <span className="visor-contador">
          {indice + 1} / {total}
          {foto.etiqueta ? ` · ${foto.etiqueta}` : ""}
        </span>
        <div className="visor-botones">
          <button type="button" className="visor-boton" onClick={descargar} disabled={descargando} title="Descargar foto">
            <IconoDescargar size={20} />
          </button>
          <button type="button" className="visor-boton" onClick={onCerrar} title="Cerrar">
            <IconoCerrar size={20} />
          </button>
        </div>
      </div>

      {total > 1 && (
        <button
          type="button"
          className="visor-flecha visor-flecha-izquierda"
          onClick={(e) => {
            e.stopPropagation();
            anterior();
          }}
          title="Foto anterior"
        >
          <IconoFlechaIzquierda size={26} />
        </button>
      )}

      <img src={foto.url} alt={foto.etiqueta || "Evidencia ampliada"} className="foto-ampliada" onClick={(e) => e.stopPropagation()} />

      {total > 1 && (
        <button
          type="button"
          className="visor-flecha visor-flecha-derecha"
          onClick={(e) => {
            e.stopPropagation();
            siguiente();
          }}
          title="Foto siguiente"
        >
          <IconoFlechaDerecha size={26} />
        </button>
      )}

      {error && <p className="visor-error">{error}</p>}
    </div>
  );
}
