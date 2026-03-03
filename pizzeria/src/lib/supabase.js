import { createClient } from "@supabase/supabase-js";

/**
 * 🗄️ CLIENTE DE SUPABASE
 *
 * MEJORAS respecto a la versión original:
 *
 * 1. Validación de variables de entorno → fallo rápido con mensaje claro
 * 2. Patrón Singleton → explicado abajo
 * 3. Opciones del cliente → persistencia de sesión, auto-refresh de tokens
 * 4. JSDoc → documentación inline para que tu editor muestre autocompletado
 *
 * ─────────────────────────────────────────────
 * ¿QUÉ SON LAS VARIABLES DE ENTORNO?
 *
 * Son valores que NO metes en el código directamente porque:
 *   - Son secretos (keys, contraseñas)
 *   - Cambian entre entornos (dev vs producción)
 *
 * En Next.js las defines en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
 *
 * El prefijo NEXT_PUBLIC_ es obligatorio para que Next.js las exponga
 * al navegador. Sin ese prefijo, solo están disponibles en el servidor.
 *
 * ⚠️  NUNCA subas .env.local a git. Añádelo a .gitignore.
 * ─────────────────────────────────────────────
 */

// ─────────────────────────────────────────────
// VALIDACIÓN TEMPRANA
//
// Tu versión original no validaba nada. Si el .env.local no existe o tiene
// typos, el error que obtenías era críptico (algo como "fetch failed" o
// "invalid URL"). Con esta validación el error es inmediato y descriptivo.
//
// typeof window === "undefined" significa "estamos en el servidor".
// Solo validamos en el servidor para no mostrar warnings en cada hot-reload
// del navegador durante el desarrollo.
// ─────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "❌ Faltan variables de entorno de Supabase.\n" +
    "Crea un archivo .env.local en la raíz con:\n" +
    "  NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co\n" +
    "  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci..."
  );
}

// ─────────────────────────────────────────────
// PATRÓN SINGLETON
//
// ¿Por qué no simplemente hacer `export const supabase = createClient(...)`?
// En desarrollo, Next.js recarga los módulos con Hot Module Replacement (HMR).
// Sin singleton, cada recarga crearía una NUEVA instancia del cliente Supabase,
// lo que puede causar:
//   - Múltiples conexiones WebSocket abiertas
//   - Pérdida de la sesión en memoria entre recargas
//   - Warnings de "multiple GoTrue instances"
//
// El singleton garantiza que solo existe UNA instancia durante toda la sesión.
//
// globalThis: es el objeto global tanto en el navegador (window) como
// en Node.js (global). Usarlo nos da compatibilidad universal.
// ─────────────────────────────────────────────

// Declaramos la variable en globalThis para persistir entre recargas HMR
/** @type {import('@supabase/supabase-js').SupabaseClient | undefined} */
let supabaseInstance = globalThis.__supabase;

if (!supabaseInstance) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // persistSession: true (por defecto) → guarda la sesión en localStorage
      // El usuario sigue logueado aunque cierre y abra el navegador
      persistSession: true,

      // autoRefreshToken: true (por defecto) → refresca el JWT automáticamente
      // Los tokens de Supabase expiran en 1 hora. Con autoRefresh=true,
      // Supabase los renueva en silencio para que el usuario no tenga que
      // volver a loguearse cada hora.
      autoRefreshToken: true,

      // detectSessionInUrl: true (por defecto) → necesario para magic links y OAuth
      // Cuando Supabase redirige de vuelta a tu app con un token en la URL
      // (ej: después de confirmar email), este flag hace que el cliente
      // detecte ese token y establezca la sesión automáticamente.
      detectSessionInUrl: true,
    },
  });

  // Guardamos la instancia en globalThis para reutilizarla en HMR
  globalThis.__supabase = supabaseInstance;
}

export const supabase = supabaseInstance;

/**
 * TABLA DE REFERENCIA — Métodos de Supabase más usados en este proyecto:
 *
 * AUTENTICACIÓN:
 *   supabase.auth.signUp({ email, password })         → registrar
 *   supabase.auth.signInWithPassword({ email, password }) → login
 *   supabase.auth.signOut()                            → logout
 *   supabase.auth.getSession()                         → sesión actual
 *   supabase.auth.resetPasswordForEmail(email)         → reset password
 *   supabase.auth.onAuthStateChange(callback)          → escuchar cambios
 *
 * BASE DE DATOS:
 *   supabase.from("tabla").select("*")                 → leer todos
 *   supabase.from("tabla").select("col1, col2")        → leer columnas
 *   supabase.from("tabla").insert([{ ... }])           → insertar
 *   supabase.from("tabla").update({ ... }).eq("id", 1) → actualizar
 *   supabase.from("tabla").delete().eq("id", 1)        → eliminar
 *   .select().single()                                 → devuelve objeto (no array)
 *   .order("created_at", { ascending: false })         → ordenar
 */