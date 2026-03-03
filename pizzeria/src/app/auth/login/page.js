"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

/**
 * 📄 PÁGINA DE LOGIN
 *
 * Cambios respecto a tu versión original:
 * 1. useRouter → para redirigir programáticamente tras el login
 * 2. router.push("/") → lleva al usuario al menú después de loguearse
 * 3. Estado "loading" → deshabilita el botón mientras espera la respuesta
 *    (evita que el usuario haga clic múltiples veces)
 * 4. Link a /register y /reset → UX básica que faltaba
 */
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // 👈 NUEVO: controla el estado del botón
  const router = useRouter(); // 👈 NUEVO: hook de Next.js para navegar entre páginas

  const handleLogin = async () => {
    setLoading(true); // Deshabilitamos el botón mientras espera

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert(error.message);
      setLoading(false); // Volvemos a habilitar el botón si hay error
    } else {
      // ✅ En lugar de un alert, redirigimos al usuario al menú principal
      // router.push() NO recarga la página completa (es navegación del lado cliente)
      // router.refresh() le dice a Next.js que re-evalúe los Server Components
      router.push("/");
      router.refresh();
      // No ponemos setLoading(false) aquí porque la página va a cambiar
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center">Iniciar sesión 🍕</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          // 👇 Permite hacer login pulsando Enter, mejor UX
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        <button
          onClick={handleLogin}
          disabled={loading} // 👈 Deshabilitado mientras carga
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white p-2 rounded font-semibold transition-colors"
        >
          {loading ? "Entrando..." : "Login"} {/* 👈 Texto dinámico según estado */}
        </button>

        {/* Links de navegación — faltaban en tu versión original */}
        <div className="flex flex-col gap-1 text-sm text-center text-gray-500">
          <Link href="/auth/register" className="hover:text-green-600 underline">
            ¿No tienes cuenta? Regístrate
          </Link>
          <Link href="/auth/reset" className="hover:text-green-600 underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>
    </div>
  );
}