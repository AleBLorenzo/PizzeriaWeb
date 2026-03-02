"use client"
import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleRegister = async () => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) alert(error.message)
    else alert("Revisa tu correo para confirmar tu cuenta 📩")
  }

  return (
    <div className="p-10 flex flex-col gap-4">
      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2"
      />
      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2"
      />
      <button
        onClick={handleRegister}
        className="bg-black text-white p-2"
      >
        Registrarse
      </button>
    </div>
  )
}