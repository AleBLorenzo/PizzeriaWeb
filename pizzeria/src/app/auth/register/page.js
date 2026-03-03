"use client";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

/**
 * 📄 PÁGINA DE REGISTRO
 *
 * Cambios respecto a tu versión original:
 * 1. Estado "sent" → tras registrarse, muestra un mensaje en lugar del formulario
 *    (el usuario no puede loguearse hasta confirmar el email, así que tiene sentido
 *    cambiar la vista en vez de dejarlo en el formulario vacío)
 * 2. Estado "loading" → misma razón que en Login
 * 3. Link a /login → para que pueda navegar si ya tiene cuenta
 */
export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false); // 👈 NUEVO: ¿se envió el email de confirmación?

  const handleRegister = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      // En lugar de un alert, cambiamos la vista completa
      // Esto es mejor UX porque el usuario entiende que debe revisar su correo
      setSent(true);
    }
  };

  // 🔄 Vista condicional: si ya se registró, mostramos confirmación
  if (sent) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm text-center flex flex-col gap-4">
          <div className="text-5xl">📩</div>
          <h2 className="text-xl font-bold">¡Revisa tu correo!</h2>
          <p className="text-gray-600 text-sm">
            Enviamos un email de confirmación a <strong>{email}</strong>.
            Haz clic en el enlace para activar tu cuenta.
          </p>
          <Link href="/auth/login" className="text-green-600 underline text-sm">
            Ir al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center">Crear cuenta 🍕</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <input
          type="password"
          placeholder="Contraseña (mín. 6 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        <button
          onClick={handleRegister}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white p-2 rounded font-semibold transition-colors"
        >
          {loading ? "Registrando..." : "Registrarse"}
        </button>

        <Link href="/auth/login" className="text-sm text-center text-gray-500 hover:text-green-600 underline">
          ¿Ya tienes cuenta? Inicia sesión
        </Link>
      </div>
    </div>
  );
}