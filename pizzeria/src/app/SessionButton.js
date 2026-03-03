"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

/**
 * 🔘 SESSION BUTTON — Barra de navegación/sesión
 *
 * Este componente aparece en todas las páginas (está en layout.js).
 * Su responsabilidad: mostrar el estado de sesión y dar acceso al logout.
 *
 * MEJORAS respecto a la versión original:
 *
 * 1. Estado "loading" mientras Supabase comprueba la sesión inicial
 *    → Tu versión devolvía null hasta que llegaba la sesión, causando un
 *      "flash" donde la barra no existía. Con loading controlado, puedes
 *      mostrar un placeholder mientras tanto.
 *
 * 2. router.refresh() tras logout
 *    → Sin esto, el middleware no se re-ejecuta y el usuario podría quedarse
 *      en una página protegida aunque ya no tenga sesión.
 *
 * 3. Links a login/register cuando no hay sesión
 *    → Tu versión devolvía null si no había sesión (la barra desaparecía).
 *      Mejor mostrar links de navegación.
 *
 * 4. Email del usuario visible en la barra
 *    → Confirma visualmente que estás logueado como el usuario correcto.
 *
 * 5. Estado "loggingOut" en el botón
 *    → Evita clicks múltiples durante el logout.
 */
export default function SessionButton() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);   // NUEVO: ¿todavía comprobando sesión?
  const [loggingOut, setLoggingOut] = useState(false); // NUEVO: ¿procesando logout?
  const router = useRouter(); // NUEVO: para redirigir y refrescar tras logout

  useEffect(() => {
    // Comprobar sesión inicial al montar el componente
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false); // Ya sabemos el estado → dejamos de "cargar"
    });

    // Suscripción a cambios de sesión en tiempo real
    // Esto hace que SessionButton se actualice automáticamente cuando:
    //   - El usuario hace login en otra pestaña
    //   - El token expira y Supabase lo refresca
    //   - El usuario hace logout desde cualquier parte
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();

    // router.refresh() es CRUCIAL aquí:
    // Le dice a Next.js que re-evalúe el middleware con la nueva sesión (null).
    // Sin esto, podrías quedarte en "/" aunque ya no tengas sesión activa
    // hasta que recargues la página manualmente.
    router.push("/auth/login");
    router.refresh();
  };

  // ─────────────────────────────────────────────
  // 💡 RENDERS CONDICIONALES
  // Usamos if/return tempranos para no anidar demasiado JSX.
  // Esto se llama "early return" y hace el código más legible.
  // ─────────────────────────────────────────────

  // Mientras comprobamos la sesión: mostramos un placeholder
  // Esto evita el "flash" de contenido que cambia bruscamente
  if (loading) {
    return (
      <nav className="p-4 bg-gray-100 dark:bg-gray-800 flex justify-end">
        <div className="w-24 h-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
      </nav>
    );
  }

  // Sin sesión: mostramos links de navegación
  if (!session) {
    return (
      <nav className="p-4 bg-gray-100 dark:bg-gray-800 flex justify-end gap-3">
        <Link
          href="/auth/login"
          className="text-sm text-gray-700 dark:text-gray-200 hover:text-green-600 font-medium"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/auth/register"
          className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 font-medium"
        >
          Registrarse
        </Link>
      </nav>
    );
  }

  // Con sesión: mostramos email y botón de logout
  return (
    <nav className="p-4 bg-gray-100 dark:bg-gray-800 flex justify-end items-center gap-4">
      <span className="text-sm text-gray-600 dark:text-gray-300">
        👤 {session.user.email}
      </span>
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="bg-gray-800 dark:bg-gray-600 text-white px-4 py-2 rounded text-sm
                   hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                   transition-colors"
      >
        {loggingOut ? "Saliendo..." : "Logout"}
      </button>
    </nav>
  );
}