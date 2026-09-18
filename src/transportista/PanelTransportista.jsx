import { useState } from "react";
import LayoutLateral from "../compartido/LayoutLateral";
import NuevoReclamo from "./NuevoReclamo";
import Seguimiento from "./Seguimiento";

const SECCIONES = [
  { clave: "nuevo", etiqueta: "Nuevo reclamo" },
  { clave: "seguimiento", etiqueta: "Seguimiento" },
];

export default function PanelTransportista() {
  const [seccion, setSeccion] = useState("nuevo");

  return (
    <LayoutLateral items={SECCIONES} activo={seccion} onCambiar={setSeccion}>
      {seccion === "nuevo" ? <NuevoReclamo /> : <Seguimiento />}
    </LayoutLateral>
  );
}
