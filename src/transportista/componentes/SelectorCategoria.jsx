import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

function formatearEtiqueta(valor) {
  return valor
    .toLowerCase()
    .split("_")
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(" ");
}

export default function SelectorCategoria({ onSeleccion }) {
  const [config, setConfig] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [categoria, setCategoria] = useState("");
  const [subcategoria, setSubcategoria] = useState("");

  useEffect(() => {
    supabase
      .from("config_subcategorias")
      .select("subcategoria, categoria, evidencias_requeridas")
      .eq("activo", true)
      .then(({ data, error: errorConsulta }) => {
        if (errorConsulta) {
          console.error("Error cargando config_subcategorias:", errorConsulta);
          setError(errorConsulta.message);
        }
        setConfig(data ?? []);
        setCargando(false);
      });
  }, []);

  const subcategoriasDisponibles = config.filter((c) => c.categoria === categoria);

  function manejarCategoria(valor) {
    setCategoria(valor);
    setSubcategoria("");
    onSeleccion(null);
  }

  function manejarSubcategoria(valor) {
    setSubcategoria(valor);
    onSeleccion(config.find((c) => c.subcategoria === valor) ?? null);
  }

  if (cargando) return <p>Cargando categorías...</p>;

  if (error) {
    return <p className="mensaje-error">No se pudieron cargar las categorías: {error}</p>;
  }

  if (config.length === 0) {
    return <p className="mensaje-error">No hay subcategorías configuradas todavía en config_subcategorias.</p>;
  }

  return (
    <div className="bloque-formulario">
      <label htmlFor="categoria">Categoría</label>
      <select id="categoria" value={categoria} onChange={(e) => manejarCategoria(e.target.value)}>
        <option value="">Selecciona...</option>
        <option value="LOGISTICO">Logístico</option>
        <option value="NO_LOGISTICO">No logístico</option>
      </select>

      {categoria && (
        <>
          <label htmlFor="subcategoria">Subcategoría</label>
          <select
            id="subcategoria"
            value={subcategoria}
            onChange={(e) => manejarSubcategoria(e.target.value)}
          >
            <option value="">Selecciona...</option>
            {subcategoriasDisponibles.map((c) => (
              <option key={c.subcategoria} value={c.subcategoria}>
                {formatearEtiqueta(c.subcategoria)}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}
