"use client"
import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message)
    else alert("Login exitoso 🔥")
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
        onClick={handleLogin}
        className="bg-black text-white p-2"
      >
        Login
      </button>
    </div>
  )
}