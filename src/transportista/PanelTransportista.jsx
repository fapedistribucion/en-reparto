import { useState } from "react";
import LayoutLateral from "../compartido/LayoutLateral";
import NuevoReclamo from "./NuevoReclamo";
import Seguimiento from "./Seguimiento";

const SECCIONES = [
  { clave: "nuevo", etiqueta: "Nuevo reclamo" },
  { clave: "seguimiento", etiqueta: "Seguimiento" },
];

// `sidebarAbierta`: igual que en PanelSAC/PanelLI, el estado del sidebar vive en App.jsx
// (se abre/cierra con la hamburguesa del header global) y se pasa hacia abajo aquí.
export default function PanelTransportista({ sidebarAbierta }) {
  const [seccion, setSeccion] = useState("nuevo");

  return (
    <LayoutLateral items={SECCIONES} activo={seccion} onCambiar={setSeccion} abierta={sidebarAbierta}>
      {seccion === "nuevo" ? <NuevoReclamo /> : <Seguimiento />}
    </LayoutLateral>
  );
}
