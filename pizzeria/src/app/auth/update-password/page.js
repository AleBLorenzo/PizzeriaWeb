"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function UpdatePassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleUpdatePassword = async () => {
    setError(null);

    if (!password || password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm text-center flex flex-col gap-4">
          <div className="text-5xl">✅</div>
          <h2 className="text-xl font-bold">¡Contraseña actualizada!</h2>
          <p className="text-gray-600 text-sm">
            Ya puedes iniciar sesión con tu nueva contraseña.
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
        <h1 className="text-2xl font-bold text-center">Nueva contraseña 🔐</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}

        <input
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        <input
          type="password"
          placeholder="Confirmar contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          onKeyDown={(e) => e.key === "Enter" && handleUpdatePassword()}
        />

        <button
          onClick={handleUpdatePassword}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white p-2 rounded font-semibold transition-colors"
        >
          {loading ? "Actualizando..." : "Cambiar contraseña"}
        </button>

        <Link href="/auth/login" className="text-sm text-center text-gray-500 hover:text-green-600 underline">
          Volver al login
        </Link>
      </div>
    </div>
  );
}
