"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function MenuPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <div>
      {user ? <p>Bienvenido {user.email}</p> : <p>Debes iniciar sesión para pedir 🍕</p>}
      {/* Aquí va el carrito y los productos */}
    </div>
  );
}