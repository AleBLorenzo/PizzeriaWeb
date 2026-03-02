"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SessionButton() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) =>
      setSession(session)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!session) return null;

  return (
    <div className="p-4 bg-gray-100 flex justify-end">
      <button
        onClick={handleLogout}
        className="bg-gray-800 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  );
}