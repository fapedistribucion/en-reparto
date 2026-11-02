import { useEffect, useRef, useState } from "react";
import { IconoCerrar, IconoDescargar, IconoFlechaDerecha, IconoFlechaIzquierda } from "./iconos";

// Visor de fotos a pantalla completa.
//  - `fotos`: [{ url, etiqueta }] de la galería que se abrió (las de la observación + la factura).
//  - `indice`: foto mostrada. `onCambiar(nuevoIndice)`: pasar a otra foto.
//  - `onDescargar(indice)`: descarga la foto que se está viendo (devuelve una promesa).
// Se navega con las flechas de la pantalla, con ← → del teclado o deslizando el dedo. Esc o clic
// fuera de la foto cierra el visor.
// Zoom: con la rueda del mouse (hacia donde apunta el cursor, de 1× a 6×). Con la foto ampliada se arrastra
// para moverla; doble clic la restablece (o, si está a tamaño normal, la amplía). Al cambiar de foto vuelve a 1×.

const ZOOM_MIN = 1;
const ZOOM_MAX = 6;
const ZOOM_DOBLE_CLIC = 2.5;
const VISTA_INICIAL = { escala: 1, x: 0, y: 0 };

export default function VisorFotos({ fotos, indice, onCambiar, onCerrar, onDescargar }) {
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState("");
  const [vista, setVista] = useState(VISTA_INICIAL); // { escala, x, y }: ampliación y desplazamiento en px
  const [arrastrando, setArrastrando] = useState(false);
  const inicioToque = useRef(null);
  const refImagen = useRef(null);
  const refFondo = useRef(null);
  const refVista = useRef(VISTA_INICIAL); // misma vista, para leerla dentro de los listeners sin re-suscribirlos
  const arrastre = useRef(null); // { x, y, vistaX, vistaY, movido }
  const ignorarClic = useRef(false);
  const total = fotos.length;
  const foto = fotos[indice];

  function aplicarVista(nueva) {
    refVista.current = nueva;
    setVista(nueva);
  }

  function anterior() {
    if (total > 1) onCambiar((indice - 1 + total) % total);
  }
  function siguiente() {
    if (total > 1) onCambiar((indice + 1) % total);
  }

  // Cambia la escala manteniendo fijo el punto de la foto que está bajo el cursor.
  function zoomEn(clienteX, clienteY, escalaNueva) {
    const img = refImagen.current;
    const actual = refVista.current;
    const escala = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, escalaNueva));
    if (!img || escala === actual.escala) return;
    if (escala <= ZOOM_MIN + 0.001) {
      aplicarVista(VISTA_INICIAL);
      return;
    }
    const caja = img.getBoundingClientRect();
    // Centro de la foto sin desplazamiento (el rect ya incluye el desplazamiento actual)
    const centroX = caja.left + caja.width / 2 - actual.x;
    const centroY = caja.top + caja.height / 2 - actual.y;
    const k = escala / actual.escala;
    aplicarVista({
      escala,
      x: clienteX - centroX - (clienteX - centroX - actual.x) * k,
      y: clienteY - centroY - (clienteY - centroY - actual.y) * k,
    });
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

  // Rueda del mouse: listener nativo (no pasivo) para poder evitar que la página de atrás se desplace.
  useEffect(() => {
    const fondo = refFondo.current;
    if (!fondo) return undefined;
    function rueda(e) {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0015);
      zoomEn(e.clientX, e.clientY, refVista.current.escala * factor);
    }
    fondo.addEventListener("wheel", rueda, { passive: false });
    return () => fondo.removeEventListener("wheel", rueda);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setError("");
    aplicarVista(VISTA_INICIAL); // otra foto: vuelve a tamaño normal
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  function empezarArrastre(e) {
    if (refVista.current.escala <= ZOOM_MIN || e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    arrastre.current = {
      x: e.clientX,
      y: e.clientY,
      vistaX: refVista.current.x,
      vistaY: refVista.current.y,
      movido: false,
    };
    setArrastrando(true);
  }

  function moverArrastre(e) {
    const a = arrastre.current;
    if (!a) return;
    const dx = e.clientX - a.x;
    const dy = e.clientY - a.y;
    if (!a.movido && Math.abs(dx) + Math.abs(dy) > 3) a.movido = true;
    aplicarVista({ ...refVista.current, x: a.vistaX + dx, y: a.vistaY + dy });
  }

  function terminarArrastre() {
    const a = arrastre.current;
    arrastre.current = null;
    setArrastrando(false);
    if (a?.movido) {
      // Soltar después de arrastrar no debe cerrar el visor (el clic "cae" en el fondo)
      ignorarClic.current = true;
      setTimeout(() => {
        ignorarClic.current = false;
      }, 0);
    }
  }

  function dobleClic(e) {
    e.stopPropagation();
    if (refVista.current.escala > ZOOM_MIN) aplicarVista(VISTA_INICIAL);
    else zoomEn(e.clientX, e.clientY, ZOOM_DOBLE_CLIC);
  }

  if (!foto) return null;

  const ampliada = vista.escala > ZOOM_MIN;

  return (
    <div
      ref={refFondo}
      className="fondo-modal fondo-modal-foto"
      onClick={(e) => {
        e.stopPropagation();
        if (ignorarClic.current) return;
        onCerrar();
      }}
      onTouchStart={(e) => {
        inicioToque.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (inicioToque.current === null) return;
        const dx = e.changedTouches[0].clientX - inicioToque.current;
        inicioToque.current = null;
        if (!ampliada && Math.abs(dx) > 50) (dx > 0 ? anterior : siguiente)();
      }}
    >
      <div className="visor-barra" onClick={(e) => e.stopPropagation()}>
        <span className="visor-contador">
          {indice + 1} / {total}
          {foto.etiqueta ? ` · ${foto.etiqueta}` : ""}
          {ampliada ? ` · ${Math.round(vista.escala * 100)} % (doble clic para restablecer)` : ""}
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

      <img
        ref={refImagen}
        src={foto.url}
        alt={foto.etiqueta || "Evidencia ampliada"}
        title="Rueda del mouse: zoom · doble clic: ampliar o restablecer"
        className={`foto-ampliada foto-zoom ${ampliada ? "foto-zoom-ampliada" : ""} ${arrastrando ? "foto-zoom-arrastrando" : ""}`}
        style={{ transform: `translate(${vista.x}px, ${vista.y}px) scale(${vista.escala})` }}
        draggable={false}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={dobleClic}
        onPointerDown={empezarArrastre}
        onPointerMove={moverArrastre}
        onPointerUp={terminarArrastre}
        onPointerCancel={terminarArrastre}
      />

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
