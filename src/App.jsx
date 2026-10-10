import { useState } from "react";
import { useAuth } from "./auth/useAuth";
import Login from "./auth/Login";
import PanelTransportista from "./transportista/PanelTransportista";
import PanelSAC from "./sac/PanelSAC";
import PanelLI from "./li/PanelLI";
import PanelLiquidaciones from "./liquidaciones/PanelLiquidaciones";
import MenuUsuario from "./compartido/MenuUsuario";
import { IconoMenu } from "./compartido/iconos";

// Los 4 roles tienen sidebar propio (SAC/LI/liquidaciones: Por factura / Por producto
// / Dashboard; transportista: Nuevo reclamo / Seguimiento). liquidaciones es de solo
// lectura (mismas tablas que LI, sin botones de acción ni detalle con fotos).
const ROLES_CON_SIDEBAR = ["sac", "li", "transportista", "liquidaciones"];

export default function App() {
  const { usuario, rol, cargando, cerrarSesion } = useAuth();
  // null = todavía sin tocar: el transportista entra con el menú oculto (va directo a "Nuevo reclamo"),
  // los demás roles con el menú abierto. Al usar la hamburguesa se guarda la elección explícita.
  const [sidebarElegida, setSidebarElegida] = useState(null);

  if (cargando) return null;

  if (!usuario) return <Login />;

  const tieneSidebar = ROLES_CON_SIDEBAR.includes(rol);
  const sidebarAbierta = sidebarElegida ?? rol !== "transportista";

  return (
    <div className="app">
      <header className="encabezado">
        <div className="encabezado-izquierda">
          {tieneSidebar && (
            <button
              type="button"
              className="boton-toggle-barra"
              onClick={() => setSidebarElegida(!sidebarAbierta)}
              aria-label={sidebarAbierta ? "Ocultar menú" : "Mostrar menú"}
              title={sidebarAbierta ? "Ocultar menú" : "Mostrar menú"}
            >
              <IconoMenu />
            </button>
          )}
          <span className="marca">EnReparto</span>
        </div>
        <MenuUsuario correo={usuario.email} onSalir={cerrarSesion} />
      </header>

      <main className="contenido">
        {rol === "transportista" && <PanelTransportista sidebarAbierta={sidebarAbierta} />}
        {rol === "sac" && <PanelSAC sidebarAbierta={sidebarAbierta} />}
        {rol === "li" && <PanelLI sidebarAbierta={sidebarAbierta} />}
        {rol === "liquidaciones" && <PanelLiquidaciones sidebarAbierta={sidebarAbierta} />}
        {!rol && (
          <div className="contenedor-simple">
            <p>Tu cuenta no tiene un rol asignado. Contacta al administrador.</p>
          </div>
        )}
      </main>
    </div>
  );
}
