"use client";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

/**
 * 📄 PÁGINA DE RESET DE CONTRASEÑA
 *
 * Cambios respecto a tu versión original:
 * 1. Vista condicional "sent" → igual que en Register, mejor UX que un alert
 * 2. Estado "loading" → deshabilita el botón mientras espera
 * 3. Link de vuelta al login
 *
 * ¿Cómo funciona resetPasswordForEmail?
 * Supabase envía un email con un link mágico que incluye un token.
 * Cuando el usuario hace clic, Supabase redirige a tu app con ese token en la URL.
 * Necesitarías una página /auth/update-password que capture ese token y
 * llame a supabase.auth.updateUser({ password: nuevaPassword })
 * (esa sería la siguiente mejora a implementar)
 */
export default function Reset() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // redirectTo: le dice a Supabase a dónde redirigir al usuario
      // después de hacer clic en el link del email.
      // Deberías tener esta página creada en tu app.
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm text-center flex flex-col gap-4">
          <div className="text-5xl">🔐</div>
          <h2 className="text-xl font-bold">¡Revisa tu correo!</h2>
          <p className="text-gray-600 text-sm">
            Enviamos un enlace a <strong>{email}</strong> para cambiar tu contraseña.
          </p>
          <Link href="/auth/login" className="text-green-600 underline text-sm">
            Volver al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center">Resetear contraseña 🔐</h1>

        <input
          type="email"
          placeholder="Tu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          onKeyDown={(e) => e.key === "Enter" && handleReset()}
        />

        <button
          onClick={handleReset}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white p-2 rounded font-semibold transition-colors"
        >
          {loading ? "Enviando..." : "Enviar enlace"}
        </button>

        <Link href="/auth/login" className="text-sm text-center text-gray-500 hover:text-green-600 underline">
          Volver al login
        </Link>
      </div>
    </div>
  );
}