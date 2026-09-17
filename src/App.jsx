import { useAuth } from "./auth/useAuth";
import Login from "./auth/Login";
import PanelTransportista from "./transportista/PanelTransportista";
import PanelSAC from "./sac/PanelSAC";
import PanelLI from "./li/PanelLI";

export default function App() {
  const { usuario, rol, cargando, cerrarSesion } = useAuth();

  if (cargando) return null;

  if (!usuario) return <Login />;

  return (
    <div className="app">
      <header className="encabezado">
        <span className="marca">EnReparto</span>
        <div className="usuario-actual">
          <span>{usuario.email}</span>
          <button onClick={cerrarSesion}>Salir</button>
        </div>
      </header>

      <main className="contenido">
        {rol === "transportista" && <PanelTransportista />}
        {rol === "sac" && <PanelSAC />}
        {rol === "li" && <PanelLI />}
        {!rol && <p>Tu cuenta no tiene un rol asignado. Contacta al administrador.</p>}
      </main>
    </div>
  );
}
