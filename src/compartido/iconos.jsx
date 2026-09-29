// Set de íconos minimalistas (trazo simple), sin dependencias externas.
// Todos aceptan className/size para que hereden el color de texto del botón.

function base(children, { size = 18, ...props } = {}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconoExportar(props) {
  return base(
    <>
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M4 19h16" />
    </>,
    props
  );
}

export function IconoRefrescar(props) {
  return base(
    <>
      <path d="M20 11a8 8 0 0 0-14.9-3.5M4 5v5h5" />
      <path d="M4 13a8 8 0 0 0 14.9 3.5M20 19v-5h-5" />
    </>,
    props
  );
}

export function IconoFiltro(props) {
  return base(
    <>
      <path d="M4 5h16l-6 7.5V19l-4 2v-8.5L4 5z" />
    </>,
    props
  );
}

// Repurpuseado como "quitar filtros" (no como "cerrar" genérico).
export function IconoQuitarFiltro(props) {
  return base(
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </>,
    props
  );
}

export function IconoCerrar(props) {
  return base(
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </>,
    props
  );
}

// Hamburguesa (abrir/cerrar sidebar): trazos SVG, no divs, para que las 3
// líneas midan siempre exactamente lo mismo (con divs + flex/gap el
// navegador puede redondear el alto de la línea del medio de forma distinta).
export function IconoMenu(props) {
  return base(
    <>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </>,
    props
  );
}

export function IconoCheck(props) {
  return base(
    <>
      <path d="M5 13l4 4L19 7" />
    </>,
    props
  );
}

export function IconoBuscar(props) {
  return base(
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>,
    props
  );
}
