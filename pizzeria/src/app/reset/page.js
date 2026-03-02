"use client"
import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Reset() {
  const [email, setEmail] = useState("")

  const handleReset = async () => {
    await supabase.auth.resetPasswordForEmail(email)
    alert("Revisa tu correo para cambiar contraseña 🔐")
  }

  return (
    <div className="p-10 flex flex-col gap-4">
      <input
        type="email"
        placeholder="Tu email"
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2"
      />
      <button
        onClick={handleReset}
        className="bg-black text-white p-2"
      >
        Resetear contraseña
      </button>
    </div>
  )
}