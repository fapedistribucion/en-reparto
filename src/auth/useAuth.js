import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Convención de user_metadata (ver crear_usuarios_prueba.py):
//   { rol: "transportista", empresa_transporte: "MUNDO" }
//   { rol: "sac" }
//   { rol: "li" }

export function useAuth() {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUsuario(data.session?.user ?? null);
      setCargando(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_evento, session) => {
      setUsuario(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const rol = usuario?.user_metadata?.rol ?? null;
  const empresaTransporte = usuario?.user_metadata?.empresa_transporte ?? null;

  async function cerrarSesion() {
    await supabase.auth.signOut();
  }

  return { usuario, rol, empresaTransporte, cargando, cerrarSesion };
}
